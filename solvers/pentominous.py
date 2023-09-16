from lib import *


class Pentominous(AbstractSolver):
    def run(self, puzzle, solve):
        # Pieces in lexicographic order of their point sets (to be consistent with returned polyomino order)
        letters = "ILYNPUVTWFZX"
        polyominoes = puzzle.polyominoes(5)
        transforms = puzzle.lattice_type.transformation_functions(allow_rotations=True, allow_reflections=True)

        sg = SymbolGrid(puzzle.lattice(), grilops.make_number_range_symbol_set(0, len(letters) - 1))

        # Enumerate all options that a polyomino can include a particular cell
        for p in sg.grid:
            choices = []
            for i, polyomino in enumerate(polyominoes):
                if p in puzzle.texts and puzzle.texts[p] != letters[i]:
                    continue
                for v in polyomino.offset_vectors:
                    for transform in transforms:
                        transformed = set(
                            [p.translate(transform(w.translate(v.negate()))) for w in polyomino.offset_vectors]
                        )
                        if any(p not in sg.grid for p in transformed):
                            continue

                        requirements = [sg.grid.get(q) == i for q in transformed]

                        # Each polyomino has a representative that verifies no neighbors have the same shape
                        if all(q >= p for q in transformed):
                            requirements.extend(
                                [
                                    sg.grid.get(q.translate(w)) != i
                                    for q in transformed
                                    for w in sg.lattice.edge_sharing_directions()
                                    if q.translate(w) not in transformed
                                ]
                            )

                        choices.append(And(requirements))
            sg.solver.add(Or(choices))

        solved_grid, solution = solve(sg)
        solution.set_regions(puzzle, solved_grid)
