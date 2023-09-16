from typing import Callable, List, Union

from grilops import SymbolGrid
from grilops.geometry import Point, Direction
from grilops.regions import RegionConstrainer
from z3 import And, BoolRef, Implies, Not, Or, Sum

from lib._utils import junctions, sight_line, var


def no2x2(sg: SymbolGrid, good: Callable[[Point], Union[bool, BoolRef]]):
    for junction in junctions(sg):
        sg.solver.add(Not(And([good(p) for p in junction])))


def no_adjacent_symbols(sg: SymbolGrid, symbol: int, no_diagonal: bool = False):
    for p in sg.grid:
        for n in sg.vertex_sharing_neighbors(p) if no_diagonal else sg.edge_sharing_neighbors(p):
            sg.solver.add(Not(And(sg.cell_is(p, symbol), n.symbol == symbol)))


def no_adjacent_regions(sg: SymbolGrid, rc: RegionConstrainer):
    for p in sg.grid:
        for n in sg.edge_sharing_neighbors(p):
            sg.solver.add(
                Implies(
                    And(rc.region_id_grid[p] != -1, rc.region_id_grid[n.location] != -1),
                    rc.region_id_grid[p] == rc.region_id_grid[n.location],
                )
            )


def require_contiguous_block_sums(sg: SymbolGrid, line: List[Point], target_sums: List[Union[int, str]]):
    # For each horizontal/vertical line, use dynamic programming where num_blocks[i] is the current number of blocks
    # seen so far. Then anytime we end a block, we check if the block is the right sum and increment num_blocks[i] if
    # so. Otherwise, we keep num_blocks[i] as the same value.
    # If the current block sum is '*', then we also allow incrementing the block regardless of the current sum.
    if not target_sums:
        return
    num_blocks = [var() for _ in line]
    for i in range(1, len(line)):
        choices = [And(num_blocks[i] == num_blocks[i - 1], Or(sg.grid[line[i - 1]] == 0, Not(sg.grid[line[i]] == 0)))]
        for block_num, target_sum in enumerate(target_sums):
            if target_sum == "*":
                choices.append(And(num_blocks[i] == block_num + 1, num_blocks[i - 1] == block_num + 1))
            else:
                next_block_num = block_num + (
                    2 if block_num + 1 < len(target_sums) and target_sums[block_num + 1] == "*" else 1
                )
                for block_size in range(1, i):
                    squares = [sg.grid[line[i - j - 1]] for j in range(block_size)]
                    choices.append(
                        And(
                            num_blocks[i] == next_block_num,
                            num_blocks[i - block_size] == block_num,
                            sg.grid[line[i]] == 0,
                            *[square != 0 for square in squares],
                            True if target_sum == "?" else Sum(squares) == target_sum,
                            sg.grid[line[i - block_size - 1]] == 0
                        )
                    )
        sg.solver.add(Or(choices))
    sg.solver.add(num_blocks[0] == (1 if target_sums[0] == "*" else 0))
    sg.solver.add(num_blocks[-1] == len(target_sums))


def require_continuous(
    sg: SymbolGrid, good: Callable[[Point], Union[bool, BoolRef]], neighbors: Callable[[Point], List[Point]] = None
):
    tree = {p: var() for p in sg.grid}
    root = var()
    for p in sg.grid:
        sg.solver.add(
            Or(
                Not(good(p)),
                sg.lattice.point_to_index(p) == root,
                *[
                    And(good(q), tree[q] < tree[p])
                    for q in (neighbors(p) if neighbors else [n.location for n in sg.edge_sharing_neighbors(p)])
                ]
            )
        )


def require_loop_direction(sg: SymbolGrid):
    class DirectionRef:
        def __init__(self, dirs):
            self._directions = dirs
            self.ref = var()

        def __eq__(self, v: Direction):
            return self.ref == self._directions.index(v)

        def __ne__(self, v: Direction):
            return self.ref != self._directions.index(v)

    directions = sg.lattice.edge_sharing_directions()
    loop_direction = {p: DirectionRef(directions) for p in sg.grid}
    for p in sg.grid:
        sg.solver.add(And(loop_direction[p].ref >= -1, loop_direction[p].ref < len(directions)))
        sg.solver.add(Implies(loop_direction[p].ref == -1, Not(sg.symbol_set.is_loop(sg.grid[p]))))
        for v in directions:
            sg.solver.add(Implies(loop_direction[p] == v, sg.cell_is_one_of(p, sg.symbol_set.symbols_for_direction(v))))
            sg.solver.add(
                Implies(
                    loop_direction[p] == v,
                    loop_direction.get(p.translate(v)) != sg.lattice.opposite_direction(v),
                )
            )
    return loop_direction


def require_region_area(sg: SymbolGrid, start: Point, good: Callable[[Point], bool], target: int):
    # Perform a floodfill from the starting point to all contiguous shaded squares.
    # Ensure the total number of reached squares is equal to the number (plus one to include the original square).
    floodfill = {p: var() for p in sg.grid}
    for p in sg.grid:
        sg.solver.add(floodfill[p] == (start == p))
    for _ in range(min(target, len(sg.grid))):
        new_floodfill = {p: var() for p in sg.grid}
        for p in sg.grid:
            sg.solver.add(
                new_floodfill[p]
                == Or(
                    floodfill[p] == 1, *[And(good(p), floodfill[n.location] == 1) for n in sg.edge_sharing_neighbors(p)]
                )
            )
        floodfill = new_floodfill
    sg.solver.add(Sum([floodfill[p] for p in sg.grid]) == target)


def require_sight_line_count(sg: SymbolGrid, p: Point, good: Callable[[Point], bool], target: int):
    all_is_visible = [good(p)]
    for direction in sg.lattice.edge_sharing_directions():
        line = sight_line(sg, p, direction)
        for i in range(1, len(line)):
            all_is_visible.append(And([good(q) for q in line[: i + 1]]))
    sg.solver.add(Sum(all_is_visible) == target)
