from abc import ABC, abstractmethod
from grilops import Point, SymbolGrid
from typing import Dict, NamedTuple


class Content(NamedTuple):

    value: str


class AbstractSolver(ABC):

    width: int
    height: int
    cells: Dict[Point, Content]
    solved_cells: Dict[Point, Content] = {}

    @abstractmethod
    def configure(self) -> SymbolGrid:
        raise NotImplementedError()

    @abstractmethod
    def to_standard_format(self, sg: SymbolGrid, solved_grid: Dict[Point, int]):
        raise NotImplementedError()
