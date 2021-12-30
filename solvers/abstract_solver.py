from abc import ABC, abstractmethod
from typing import Dict

from grilops import Lattice, Point, SymbolGrid, SymbolSet
from threading import Condition, Lock
from time import time


class AbstractSolver(ABC):
    """
    Every subclass must have a constructor that takes a single string parameter, the pzprv3 string for the puzzle.
    Examples of this format can be found by inputting a puzzle and clicking "File" -> "Save file as ...".
    The constructor should parse the pzprv3 string into more convenient data structures.
    """

    def solve(self) -> str:
        """Return the pzprv3 string for the solved puzzle."""
        with GlobalTimeoutLock(timeout=30):
            sg = SymbolGrid(self.lattice(), self.symbol_set())
            self.configure(sg)
            sg.solver.set("timeout", 30000)
            if not sg.solve():
                if sg.solver.reason_unknown() == "timeout":
                    raise TimeoutError(408)
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


class GlobalTimeoutLock:

    _lock = Lock()
    _cond = Condition(Lock())

    def __init__(self, timeout):
        self.timeout = timeout

    def __enter__(self):
        with GlobalTimeoutLock._cond:
            current_time = time()
            stop_time = current_time + self.timeout
            while current_time < stop_time:
                if GlobalTimeoutLock._lock.acquire(False):
                    return self
                else:
                    GlobalTimeoutLock._cond.wait(stop_time - current_time)
                    current_time = time()
            raise TimeoutError(503)

    def __exit__(self, exc_type, exc_val, exc_tb):
        with GlobalTimeoutLock._cond:
            GlobalTimeoutLock._lock.release()
            GlobalTimeoutLock._cond.notify()
