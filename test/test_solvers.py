import unittest

from solvers import get_demo, solve


class TestSolvers(unittest.TestCase):

    def test_aquarium(self):
        self._test_helper('aquarium')

    def test_cave(self):
        self._test_helper('cave')

    def test_castlewall(self):
        self._test_helper('castle')

    def test_easyasabc(self):
        self._test_helper('easyasabc')

    def test_fillomino(self):
        self._test_helper('fillomino')

    def test_hashiwokakero(self):
        self._test_helper('hashikake')

    def test_heteromino(self):
        self._test_helper('heteromino')

    def test_heyawake(self):
        self._test_helper('heyawake')

    def test_hitori(self):
        self._test_helper('hitori')

    def test_kakuro(self):
        self._test_helper('kakuro')

    def test_kropki(self):
        self._test_helper('kropki')

    def test_lightup(self):
        self._test_helper('lightup')

    def test_lits(self):
        self._test_helper('lits')

    def test_masyu(self):
        self._test_helper('mashu')

    def test_minesweeper(self):
        self._test_helper('mines')

    def test_nonogram(self):
        self._test_helper('nonogram')

    def test_numberlink(self):
        self._test_helper('numlin')

    def test_nurikabe(self):
        self._test_helper('nurikabe')

    def test_shakashaka(self):
        self._test_helper('shakashaka')

    def test_shikaku(self):
        self._test_helper('shikaku')

    def test_simpleloop(self):
        self._test_helper('simpleloop')

    def test_skyscrapers(self):
        self._test_helper('skyscrapers')

    def test_slitherlink(self):
        self._test_helper('slither')

    def test_starbattle(self):
        self._test_helper('starbattle')

    def test_sudoku(self):
        self._test_helper('sudoku')

    def test_tapa(self):
        self._test_helper('tapa')

    def test_tentaisho(self):
        self._test_helper('tentaisho')

    def test_tents(self):
        self._test_helper('tents')

    def test_yajilin(self):
        self._test_helper('yajilin')

    def test_yinyang(self):
        self._test_helper('yinyang')

    def _test_helper(self, puzzle_type):
        pzprv3, expect = get_demo(puzzle_type)
        self.assertEqual(expect, solve(pzprv3))

        # verify uniqueness
        self.assertIsNone(solve(pzprv3, expect))


if __name__ == '__main__':
    unittest.main()
