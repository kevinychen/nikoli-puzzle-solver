from lib._directions import Directions
from lib._global_timeout_lock import GlobalTimeoutLock
from lib._penpa import Penpa
from lib._puzzle import Puzzle, Solution, Symbol, Symbols
from lib._union_find import UnionFind
from lib._utils import continuous_region, no_adjacent_symbols, no2x2, sight_line, var


import grilops
from grilops import SymbolGrid
from grilops.geometry import Point, Vector
from grilops.loops import I, L, LoopConstrainer, LoopSymbolSet, O
from grilops.regions import R, RegionConstrainer
from grilops.shapes import Shape, ShapeConstrainer
from z3 import And, Distinct, If, Implies, Int, Not, Or, Product, Sum

from solvers.abstract_solver import AbstractSolver
