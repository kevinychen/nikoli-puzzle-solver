from grilops import Direction, Vector


class Directions:

    E = Direction("E", Vector(0, 1))
    NE = Direction("NE", Vector(-1, 1))
    N = Direction("E", Vector(-1, 0))
    NW = Direction("NW", Vector(-1, -1))
    W = Direction("E", Vector(0, -1))
    SW = Direction("SW", Vector(1, -1))
    S = Direction("E", Vector(1, 0))
    SE = Direction("SE", Vector(1, 1))
