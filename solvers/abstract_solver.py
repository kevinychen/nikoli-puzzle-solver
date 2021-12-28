from abc import ABC, abstractmethod
from typing import Dict

from grilops import Lattice, Point, SymbolGrid, SymbolSet


class AbstractSolver(ABC):
    """
    Every subclass must have a constructor that takes a single string parameter, the pzprv3 string for the puzzle.
    Examples of this format can be found by inputting a puzzle and clicking "File" -> "Save file as ...".
    The constructor should parse the pzprv3 string into more convenient data structures.
    """

    def solve(self) -> str:
        """Return the pzprv3 string for the solved puzzle."""
        sg = SymbolGrid(self.lattice(), self.symbol_set())
        self.configure(sg)
        sg.solver.set("timeout", 30000)
        if not sg.solve():
            return None
        return self.to_pzprv3(sg.solved_grid())

    @abstractmethod
    def to_pzprv3(self, solved_grid: Dict[Point, int]) -> str:
        """Converts a solved grid into a pzprv3 string."""
        raise NotImplementedError()

    @abstractmethod
    def lattice(self) -> Lattice:
        """The coordinates of the grid to solve, and the keys of solved_grid."""
        raise NotImplementedError()

    @abstractmethod
    def symbol_set(self) -> SymbolSet:
        """
        The list of valid symbols in the solved grid.
        Each value in solved_grid is the index of the symbol in this list.
        """
        raise NotImplementedError()

    @abstractmethod
    def configure(self, sg: SymbolGrid):
        """Add constraints to the solver (sg.solver) based on the rules of the puzzle."""
        raise NotImplementedError()
