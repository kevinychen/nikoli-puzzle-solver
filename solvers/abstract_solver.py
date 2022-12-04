from abc import ABC, abstractmethod
from typing import Callable, Dict

from grilops import Lattice, Point, SymbolGrid, SymbolSet

from lib import Puzzle


class AbstractSolver(ABC):

    @abstractmethod
    def configure(
            self,
            puzzle: Puzzle,
            init_symbol_grid: Callable[[Lattice, SymbolSet], SymbolGrid],
    ):
        """Converts the common Puzzle format into a constraint problem."""
        raise NotImplementedError()

    @abstractmethod
    def set_solved(
            self,
            puzzle: Puzzle,
            sg: SymbolGrid,
            solved_grid: Dict[Point, int],
            solved: Puzzle):
        """Converts the solution to the constraint problem into the common Puzzle format."""
        raise NotImplementedError()
