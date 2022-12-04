from abc import ABC, abstractmethod
from grilops import Point, SymbolGrid
from typing import Dict, NamedTuple


class Content(NamedTuple):

    value: str = None
    black: bool = False


class AbstractSolver(ABC):

    width: int
    height: int
    cells: Dict[Point, Content]

    solved_cells: Dict[Point, Content] = {}
    # Key (y,x) corresponds to the right border of the square at (y,x)
    solved_vertical_borders: Dict[Point, Content] = {}
    # Key (y,x) corresponds to the bottom border of the square at (y,x)
    solved_horizontal_borders: Dict[Point, Content] = {}

    @abstractmethod
    def configure(self) -> SymbolGrid:
        """Using the fields that don't start with 'solved_', configure the constraint problem."""
        raise NotImplementedError()

    @abstractmethod
    def to_standard_format(self, sg: SymbolGrid, solved_grid: Dict[Point, int]):
        """Given the solution to the constraint problem, fill in the fields that start with 'solved_' accordingly."""
        raise NotImplementedError()
