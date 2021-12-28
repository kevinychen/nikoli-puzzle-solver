import unittest

from solvers import get_demo, solve


class TestSolvers(unittest.TestCase):

    def test_aquarium(self):
        pzprv3, expect = get_demo('aquarium')
        self.assertEqual(expect, solve(pzprv3))

    def test_cave(self):
        pzprv3, expect = get_demo('cave')
        self.assertEqual(expect, solve(pzprv3))

    def test_easyasabc(self):
        pzprv3, expect = get_demo('easyasabc')
        self.assertEqual(expect, solve(pzprv3))

    def test_fillomino(self):
        pzprv3, expect = get_demo('fillomino')
        self.assertEqual(expect, solve(pzprv3))

    def test_hashiwokakero(self):
        pzprv3, expect = get_demo('hashikake')
        self.assertEqual(expect, solve(pzprv3))

    def test_heteromino(self):
        pzprv3, expect = get_demo('heteromino')
        self.assertEqual(expect, solve(pzprv3))

    def test_heyawake(self):
        pzprv3, expect = get_demo('heyawake')
        self.assertEqual(expect, solve(pzprv3))

    def test_hitori(self):
        pzprv3, expect = get_demo('hitori')
        self.assertEqual(expect, solve(pzprv3))

    def test_kakuro(self):
        pzprv3, expect = get_demo('kakuro')
        self.assertEqual(expect, solve(pzprv3))

    def test_kropki(self):
        pzprv3, expect = get_demo('kropki')
        self.assertEqual(expect, solve(pzprv3))

    def test_lightup(self):
        pzprv3, expect = get_demo('lightup')
        self.assertEqual(expect, solve(pzprv3))

    def test_lits(self):
        pzprv3, expect = get_demo('lits')
        self.assertEqual(expect, solve(pzprv3))

    def test_masyu(self):
        pzprv3, expect = get_demo('mashu')
        self.assertEqual(expect, solve(pzprv3))

    def test_minesweeper(self):
        pzprv3, expect = get_demo('mines')
        self.assertEqual(expect, solve(pzprv3))

    def test_nonogram(self):
        pzprv3, expect = get_demo('nonogram')
        self.assertEqual(expect, solve(pzprv3))

    def test_numberlink(self):
        pzprv3, expect = get_demo('numlin')
        self.assertEqual(expect, solve(pzprv3))

    def test_nurikabe(self):
        pzprv3, expect = get_demo('nurikabe')
        self.assertEqual(expect, solve(pzprv3))

    def test_shikaku(self):
        pzprv3, expect = get_demo('shikaku')
        self.assertEqual(expect, solve(pzprv3))

    def test_skyscrapers(self):
        pzprv3, expect = get_demo('skyscrapers')
        self.assertEqual(expect, solve(pzprv3))

    def test_slitherlink(self):
        pzprv3, expect = get_demo('slither')
        self.assertEqual(expect, solve(pzprv3))

    def test_starbattle(self):
        pzprv3, expect = get_demo('starbattle')
        self.assertEqual(expect, solve(pzprv3))

    def test_sudoku(self):
        pzprv3, expect = get_demo('sudoku')
        self.assertEqual(expect, solve(pzprv3))

    def test_tapa(self):
        pzprv3, expect = get_demo('tapa')
        self.assertEqual(expect, solve(pzprv3))

    def test_tentaisho(self):
        pzprv3, expect = get_demo('tentaisho')
        self.assertEqual(expect, solve(pzprv3))

    def test_tents(self):
        pzprv3, expect = get_demo('tents')
        self.assertEqual(expect, solve(pzprv3))

    def test_yajilin(self):
        pzprv3, expect = get_demo('yajilin')
        self.assertEqual(expect, solve(pzprv3))

    def test_yinyang(self):
        pzprv3, expect = get_demo('yinyang')
        self.assertEqual(expect, solve(pzprv3))


if __name__ == '__main__':
    unittest.main()
