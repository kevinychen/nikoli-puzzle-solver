from typing import List, NamedTuple, Tuple, Union

from grilops import Direction, Vector

from lib._directions import Directions


class Symbol(NamedTuple):
    style: Union[int, List[int]]
    shape: str

    def get_arrows(self) -> List[Direction]:
        if type(self.style) == int:
            return [self.__get_directions(self.shape)[self.style]]
        else:
            return [v for v, flag in zip(self.__get_directions(self.shape), self.style) if flag]

    def is_black(self):
        return self.style == 2 or self.shape.endswith("_B")

    def is_circle(self):
        return self.shape.startswith("circle_") or (self.shape == "ox_B" and self.style == 1)

    @staticmethod
    def from_arrow(shape: str, v: Direction):
        return Symbol(Symbol.__get_directions(shape).index(v), shape)

    @staticmethod
    def __get_directions(shape: str) -> Tuple[Direction, ...]:
        unused = Direction("", Vector(0, 0))

        if shape.startswith("arrow_fouredge_"):
            return (
                Directions.E,
                Directions.S,
                Directions.W,
                Directions.N,
                Directions.W,
                Directions.N,
                Directions.E,
                Directions.S,
            )
        elif shape == "arrow_cross":
            return Directions.W, Directions.N, Directions.E, Directions.S
        elif shape == "arrow_S" or shape.startswith("arrow_B_") or shape.startswith("arrow_N_"):
            return (
                unused,
                Directions.W,
                Directions.NW,
                Directions.N,
                Directions.NE,
                Directions.E,
                Directions.SE,
                Directions.S,
                Directions.SW,
            )
        elif shape == "firefly" or shape == "pencils":
            return unused, Directions.E, Directions.S, Directions.W, Directions.N
        elif shape == "inequality":
            return (
                unused,
                Directions.W,
                Directions.N,
                Directions.E,
                Directions.S,
                Directions.W,
                Directions.N,
                Directions.E,
                Directions.S,
            )


class Symbols:
    WATER = Symbol(7, "battleship_B")
    VERY_SMALL_WHITE_CIRCLE = Symbol(8, "circle_SS")
    HORIZONTAL_LINE = Symbol(1, "line")
    VERTICAL_LINE = Symbol(2, "line")
    PLUS_SIGN = Symbol(2, "math")
    MINUS_SIGN = Symbol(3, "math")
    NW_TO_SE = Symbol(5, "ox_B")
    NE_TO_SW = Symbol(6, "ox_B")
    STAR = Symbol(2, "star")
    LIGHT_BULB = Symbol(3, "sun_moon")
    BOMB = Symbol(4, "sun_moon")
    TREE = Symbol(1, "tents")
    TENT = Symbol(2, "tents")
