from typing import List, NamedTuple, Union

from grilops import Direction

from lib._directions import Directions


class Symbol(NamedTuple):

    style: Union[int, List[int]]
    shape: str

    def get_arrows(self) -> List[Direction]:
        if self.shape.startswith("arrow_fouredge_"):
            directions = (
                Directions.E,
                Directions.S,
                Directions.W,
                Directions.N,
                Directions.W,
                Directions.N,
                Directions.E,
                Directions.S,
            )
        elif self.shape == "arrow_cross":
            directions = Directions.W, Directions.N, Directions.E, Directions.S
        elif self.shape == "arrow_S" or self.shape.startswith("arrow_N_"):
            directions = (
                None,
                Directions.W,
                Directions.SW,
                Directions.N,
                Directions.NE,
                Directions.E,
                Directions.SE,
                Directions.S,
                Directions.SW,
            )
        elif self.shape == "inequality":
            directions = (
                None,
                Directions.W,
                Directions.N,
                Directions.E,
                Directions.S,
                Directions.W,
                Directions.N,
                Directions.E,
                Directions.S,
            )
        else:
            assert False
        if type(self.style) == int:
            return [directions[self.style]]
        else:
            return [v for v, flag in zip(directions, self.style) if flag]

    def is_black(self):
        return self.style == 2

    def is_circle(self):
        return self.shape.startswith("circle_")


class Symbols:

    WATER = Symbol(7, "battleship_B")
    BLACK_CIRCLE = Symbol(2, "circle_L")
    WHITE_CIRCLE = Symbol(8, "circle_L")
    PLUS_SIGN = Symbol(2, "math")
    MINUS_SIGN = Symbol(3, "math")
    NW_TO_SE = Symbol(5, "ox_B")
    NE_TO_SW = Symbol(6, "ox_B")
    X = Symbol(0, "star")
    STAR = Symbol(2, "star")
    SUN = Symbol(1, "sun_moon")
    MOON = Symbol(2, "sun_moon")
    LIGHT_BULB = Symbol(3, "sun_moon")
    BOMB = Symbol(4, "sun_moon")
    TREE = Symbol(1, "tents")
    TENT = Symbol(2, "tents")
