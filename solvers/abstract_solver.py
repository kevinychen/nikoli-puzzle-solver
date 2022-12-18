from abc import ABC, abstractmethod
from typing import Callable, Dict, Tuple

from grilops import Point, SymbolGrid

from lib import Puzzle, Solution


class AbstractSolver(ABC):
    @abstractmethod
    def run(self, puzzle: Puzzle, solve: Callable[[SymbolGrid], Tuple[Dict[Point, int], Solution]]):
        """
        1. Given the puzzle data, construct a set of constraints for solving the puzzle.
        2. Call :param solve to find a set of values satisfying the constraints.
        3. Fill in the Solution object based on the values.
        """
        return NotImplementedError()
