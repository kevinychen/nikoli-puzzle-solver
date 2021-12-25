from abc import ABC, abstractmethod
from grilops import Lattice, SymbolGrid, SymbolSet


class AbstractSolver(ABC):

    @abstractmethod
    def __init__(self, _pzprv3: str):
        raise NotImplementedError()

    def solve(self):
        sg = SymbolGrid(self.lattice(), self.symbol_set())
        self.configure(sg)
        if not sg.solve():
            return None
        return self.to_pzprv3(sg.solved_grid())

    @abstractmethod
    def to_pzprv3(self, solved_grid):
        raise NotImplementedError()

    @abstractmethod
    def lattice(self) -> Lattice:
        raise NotImplementedError()

    @abstractmethod
    def symbol_set(self) -> SymbolSet:
        raise NotImplementedError()

    @abstractmethod
    def configure(self, sg: SymbolGrid):
        raise NotImplementedError()
