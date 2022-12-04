from abc import ABC, abstractmethod
from grilops import Point, SymbolGrid
from typing import Dict, NamedTuple, Set


class Symbol(NamedTuple):

    style: int
    shape: str


class AbstractSolver(ABC):

    width: int
    height: int
    symbols: Dict[Point, Symbol]
    texts: Dict[Point, str]

    solved_texts: Dict[Point, str]
    # Contains (y, x) if there is a line from (y, x) to (y+1, x)
    solved_vertical_lines: Set[Point]
    # Contains (y, x) if there is a line from (y, x) to (y, x+1)
    solved_horizontal_lines: Set[Point]
    # Contains (y,x) if square (y,x) has a right border
    solved_vertical_borders: Set[Point]
    # Contains (y,x) if square (y,x) has a bottom border
    solved_horizontal_borders: Set[Point]

    @abstractmethod
    def configure(self) -> SymbolGrid:
        """Using the fields that don't start with 'solved_', configure the constraint problem."""
        raise NotImplementedError()

    @abstractmethod
    def to_standard_format(self, sg: SymbolGrid, solved_grid: Dict[Point, int]):
        """Given the solution to the constraint problem, fill in the fields that start with 'solved_' accordingly."""
        raise NotImplementedError()
