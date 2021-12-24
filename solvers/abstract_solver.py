from abc import ABC, abstractmethod
from grilops import Lattice, SymbolGrid, SymbolSet


class AbstractSolver(ABC):

    @abstractmethod
    def __init__(self, _pzprv3: str):
        pass

    def solve(self):
        sg = SymbolGrid(self.lattice(), self.symbol_set())
        self.configure(sg)
        if not sg.solve():
            return None
        return self.to_pzprv3(sg.solved_grid())

    @abstractmethod
    def to_pzprv3(self, solved_grid):
        pass

    @abstractmethod
    def lattice(self) -> Lattice:
        pass

    @abstractmethod
    def symbol_set(self) -> SymbolSet:
        pass

    @abstractmethod
    def configure(self, sg: SymbolGrid):
        pass
