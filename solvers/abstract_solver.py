from abc import ABC, abstractmethod
from typing import Callable, Dict

from grilops import Lattice, Point, SymbolGrid, SymbolSet

from lib import Puzzle, Solution


class AbstractSolver(ABC):

    @abstractmethod
    def configure(
            self,
            puzzle: Puzzle,
            init_symbol_grid: Callable[[Lattice, SymbolSet], SymbolGrid],
    ):
        """
        Given the puzzle data, constructs a set of constraints for solving the puzzle.

        :param puzzle: The puzzle input in Penpa (without the solution).
        :param init_symbol_grid: This function must be called exactly once. It returns a SymbolGrid sg, which has
        variables for each point in the Lattice (HEIGHT x WIDTH for a rectangular lattice) that are already constrained
        by the given SymbolSet. More constraints can be added using the Grilops functions on sg. Alternatively,
        "sg.solver" is the raw z3 solver, and new variables/constraints can be added to the solver directly.

        Note that only the variables of sg are considered for uniqueness - a solution with the same values for the
        variables in sg but different values for other variables is not considered different.
        """
        raise NotImplementedError()

    @abstractmethod
    def set_solved(
            self,
            puzzle: Puzzle,
            sg: SymbolGrid,
            solved_grid: Dict[Point, int],
            solution: Solution):
        """
        Given the result of the constraint problem, updates the solution accordingly.

        :param puzzle: The original puzzle input in Penpa (without the solution)
        :param sg: The SymbolGrid created in :func:`configure`.
        :param solved_grid: A mapping from each point in the Lattice (as set in :func:`configure`) to the value of the
        corresponding variable that satisfies the constraints.
        :param solution: An initially empty object whose fields should be filled in by this method.
        """
        raise NotImplementedError()
