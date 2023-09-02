from lib._constraints import (
    no2x2,
    no_adjacent_regions,
    no_adjacent_symbols,
    require_contiguous_block_sums,
    require_continuous,
    require_region_area,
    require_sight_line_count,
)
from lib._directions import Directions
from lib._global_timeout_lock import GlobalTimeoutLock
from lib._paths import CrossingPathConstrainer, CrossingPathSymbolSet
from lib._penpa import Penpa
from lib._puzzle import Puzzle, Solution
from lib._symbols import Symbol, Symbols
from lib._union_find import UnionFind
from lib._utils import (
    junctions,
    sight_line,
    straight_edge_sharing_direction_pairs,
    var,
)


import grilops
from grilops import SymbolGrid
from grilops.geometry import Point, Vector
from grilops.loops import I, L, LoopConstrainer, LoopSymbolSet, O
from grilops.paths import PathConstrainer, PathSymbolSet
from grilops.regions import R, RegionConstrainer
from grilops.shapes import Shape, ShapeConstrainer
from z3 import And, Distinct, If, Implies, Int, Not, Or, Product, Sum

from solvers.abstract_solver import AbstractSolver
