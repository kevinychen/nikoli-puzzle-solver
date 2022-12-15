from lib._directions import Directions
from lib._global_timeout_lock import GlobalTimeoutLock
from lib._penpa import Penpa
from lib._puzzle import Puzzle, Solution, Symbol, Symbols
from lib._utils import continuous_region, distinct_rows_and_columns, no_adjacent_symbols, sight_line, var


import grilops
from grilops.geometry import Point, RectangularLattice, Vector
from grilops.loops import I, L, LoopConstrainer, LoopSymbolSet, O
from grilops.regions import R, RegionConstrainer
from grilops.shapes import Shape, ShapeConstrainer
from z3 import And, Distinct, Implies, Int, Not, Or, Product, Sum

from solvers.abstract_solver import AbstractSolver
