from solvers.nurikabe import solve
import unittest


class TestNurikabe(unittest.TestCase):

    def test_basic(self):
        result = solve('pzprv3/nurikabe/9/10/2 . . . . . . . . 2 /. . . . . . 2 . . . /. 2 . . 7 . . . . . /. . . . . .'
                       + ' . . . . /. . . . . . 3 . 3 . /. . 2 . . . . 3 . . /2 . . 4 . . . . . . /. . . . . . . . . . '
                       + '/. 1 . . . . 2 . 4 . /')
        self.assertEqual(result, 'pzprv3/nurikabe/9/10/2 + # + + + # # + 2 /# # # + + # 2 # # # /# 2 # + 7 # + # + # /#'
                         + ' + # # # # # # + # /# # + # + + 3 # 3 # /+ # 2 # # # # 3 # # /2 # # 4 + # + + # + /# # + + '
                         + '# # # # # + /# 1 # # # + 2 # 4 + /')


if __name__ == '__main__':
    unittest.main()
