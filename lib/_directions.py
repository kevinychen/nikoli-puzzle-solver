from grilops import Direction, Vector


class Directions:

    E = Direction("E", Vector(0, 1))
    NE = Direction("NE", Vector(-1, 1))
    N = Direction("N", Vector(-1, 0))
    NW = Direction("NW", Vector(-1, -1))
    W = Direction("W", Vector(0, -1))
    SW = Direction("SW", Vector(1, -1))
    S = Direction("S", Vector(1, 0))
    SE = Direction("SE", Vector(1, 1))
