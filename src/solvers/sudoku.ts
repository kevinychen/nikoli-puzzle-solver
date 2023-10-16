import { Constraints, Context, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ Distinct, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Place a number in each cell
    // Numbers must be between 1 and N, where N is the width of the board
    const grid = new ValueMap(puzzle.points, _ => cs.int(1, puzzle.width));

    // Some numbers are given
    for (const [p, text] of puzzle.texts) {
        cs.add(grid.get(p).eq(parseInt(text)));
    }

    // Each row and column contains exactly one of each number
    for (const [line] of puzzle.points.lines()) {
        cs.add(Distinct(...line.map(p => grid.get(p))));
    }

    // Each outlined block contains exactly one of each number
    for (const region of puzzle.regions()) {
        cs.add(Distinct(...region.map(p => grid.get(p))));
    }

    // Handle arrow sudoku variant
    for (const arrow of puzzle.arrows) {
        cs.add(Sum(...arrow.slice(1).map(p => grid.get(p))).eq(grid.get(arrow[0])));
    }

    // Handle killer sudoku variant cages
    for (const cage of puzzle.cages) {
        const numberLocation = [...puzzle.edgeTexts.keys()].find(([p]) => cage.some(q => q.eq(p)));
        const number = parseInt(puzzle.edgeTexts.get(numberLocation));
        cs.add(Sum(...cage.map(p => grid.get(p))).eq(number));
        cs.add(Distinct(...cage.map(p => grid.get(p))));
    }

    // Handle thermo sudoku variant
    for (const thermo of puzzle.thermo) {
        for (let i = 1; i < thermo.length; i++) {
            cs.add(grid.get(thermo[i - 1]).lt(grid.get(thermo[i])));
        }
    }

    const model = await cs.solve(grid);

    // Fill in solved numbers
    for (const [p, arith] of grid) {
        if (!puzzle.texts.has(p)) {
            solution.texts.set(p, model.get(arith).toString());
        }
    }
};

solverRegistry.push({
    name: "Sudoku",
    keywords: ["Number Place"],
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VZNb+s2ELz7VwQ68yBSEi3plqZJL6nb16QIAsEIZEcvMSJbqWz3FTL83zO7YuLVR1EURdEcCtv0ekTOzJJc0tv9Y/WyVwleQax8pfEKYp8/cUhv371uV7uySM/U+X73XNUIlPrp6kp9zcttMclcr/nk0CRp80U1P6SZpz3lGXy0N1fNl/TQ/Jg2M9Xc4JGnNLDrtpNBeHkK7/g5RRctqH3EMxcjvEe4XNXLsni4bpGf06y5VR7pfMejKfTW1e+F53zQ72W1XqwIWOQ7JLN9Xr26J+00uL56flTNeWv3ZsRucLJLYWuXohG7lMW/bDeZH4+Y9l9g+CHNyPuvpzA+hTfpAe0sPXgmpqEhvLRr45mEgOgEBD4BUwFoArCYH0DwPlvvQEhALICIACsAS0ByAkJDQCAAHiJ8hDxEOI1YRchGPEQYi/oqlq0LUtuXtdOe05jTF0Ni5hCkMXMI2ZjnQziN2YdQSdipBLiHUEl4GYQP7XMXIaN99ip0tM+rKaZE+8wjlLTur6fW/Yy05pSEHa0HPIb7iEXWhhdEejacp2Q2gywMZyE9B8wsRw02lA4GfkLO62M2sL817/J7bq+4NdzeoghUE3D7Pbc+txG319znErWhY6s0LYQBY5IoQ9OCGN/KUGoUm0iZANNOMY5NE2EyKY60Mha2KbahMlOkSfF0qkwCqxQnOFx9bBbij8HvO34f/Nrxa/BTkbIW+EPHH4KfKoC1wE8bl7XAT3uWYhzcJmn58Q0tTD7zkH+HmwCx4zHgkXnRYnFsETt+A37ph84LjuGfjgqeB+jSKcF+aB5cXha61ula6Mr5sU7XQtc6XQtdmZd1uha61ula6E5JF4t2x0t3wW3IreUlndKp97fOxX++e/7STobZoytWvqLPhcwnmTfbrxdFfTar6nVeerjUvW1VPmz39dd8iSuK73zcQsA23LMDlVX1Wq423X6rp01VF6OPCCwen8b6L6r6scf+LS/LDrD9bZ/X3cHtZduBdjVuUvE7r+vqWwdZ57vnDiBu3Q5Tsdl1DezyrsX8Je+prU85HyfeHx5/sgD/mIL//zH9R/+YaAn8z3Y+fDY7vHurerT0AY9UP9DRKnf4oNCBD0qaBIdVDXSksIH2axvQsLwBDioc2J8UObH265xc9UudpAbVTlKy4LP55A0=",
            answer: "m=edit&p=7VZNbxs3EL3rVwR75oEzXH7plqZxLo7b1C6KQBCMta3EQlbedCU1xRr67x1yudJyVgVaFEVyCNaiR2/J9x4/ZsTt/qH5tBeeHuWEFECPcjJ+XBn+ZHpu1rt6NX8hXu53j01LgRA/XVyID1W9Xc0Wqddy9tz5efdOdG/miwIKUSB9oFiK7t38uXs7765Ed02vCgGEXfadkMLXp/C3+D5Er3oQJMVXKabwPYX36/a+Xt1e9sjP80V3I4qg80McHcJi0/yxKpKP8P2+2dytA3BX7Wgy28f15/RmG5ehGCQOonvZ270+Y1ed7KqjXXXeLv7/dv3ycKBl/4UM384Xwfuvp9Cdwuv58yH4ei7QhaEleen3pkAfAH0ClAyAHQEQABwBalitASgD4EaADoAZASYA/gSUGAA1AjTzURrmVJdMVmtmTHMVA4zUcFljmVMn2RAHjNQhk3WKOXWGqXjNAcNUvGc+QBomA9IyHZCOLQlIz5QA+H4C8BkBILMDMOFBZJsMWHLPqDkzTmaBlntWyEdNDhSoiZ9SZqtB5xviKX8f24vYYmxvKAlEp2L7Y2xlbHVsL2Of15Qb4IyAsBFIjN4LDMtCMf0XGKYWYtQCletjKpuooY81CDRlH5tSoLV9bK1AL/vYU3GVqud3xC8TvyR+SPxA/Jj4kfjLxF8Sv078mvhN4jfE7xI/FW70Kmkp0jKJJ/hPOCqKEw+W+bxw6G8oTvxocz/oU0z+VdJVpKuSTxPWIc3LkK5Jukbl62OSriFdk3SNyedlkq4hXZN0DenaoHsI5Tds3avYlrE1cUttqHpUF8dbbvLNTuVQDfUAh6oD6eQdAZUO+REo02k9AsOBPgIuZdwR8CkJBkBbRqodk9WecZjhuB8BPsR41sNKxmGBObV8+lYxp5bP1g51egBcyebiNDPm+AI5vkBecaBkQ7xlPrxjTkHyFQLJNxNATRBuH5AvGyCwOQMqrqX4OYH+RxDGiOGeleXMKl+bY1nrS9b1qMT1ZS3kwGG2oNQE9uhvC1nOFsXVfnO3al9cNe2mqgu6MRbbpr7d7tsP1T3df+KFUkTsKfbMoLppPtfrp7zf+uNT067Ovgrg6uHjuf53TfvA2L9UdZ0B29/3VZsP7m9yGbRr19n3qm2bLxmyqXaPGTC60mVMq6ddbmBX5RarTxVT25zmfJgVfxbxs1B0HVffr+Nf6ToetkD+q0v5f7+6/IPfwm/LTjy9TXs29Qk+k/2Ens3yhE8SnfBJSgfBaVYTeiaxCeW5TdA0vQmcZDhhf5PkgZXneXDFUz1ITbI9SI0TfrGc/QU=",
        },
        {
            name: "Sudoku (arrows)",
            puzzle: "m=edit&p=7VbPb9tGE73rrzB4nsP+IJdc3tw07sVVm9pFEBCCQdtKLIQyU0pqPtDw/543w020pNgfH1CgPhQUV6PH3TdvZna42h3u248H8rhsQYo0LlsouYuUPypc15t9sy7P6Pywf2g7GEQ/XVzQ+7rZrRdVmLVaPPW+7N9Q/0NZJTqhxODWyYr6N+VT/2PZL6m/wqOENLDLYZKB+fpovpXnbL0aQK1gL4MN8x3Mu01316xvLgfk57LqLSXs5ztZzWaybX9fJ0EH/75rt7cbBm7rPYLZPWw+hSdDGsJcvXqm/nyQezUj1x7lsjnIZWtGLkcxL/f6n5LrV8/PSPsvEHxTVqz916NZHM2r8gnjsnxKbMZLHbQMtUlSzUAeAXY6I/+anABk6RTwDGRHIDcMFBEgpNgQ3wDRES0pREcMOAb8EfDiNgaEIyL1ssRGgEiPSLVSk3C1kkURi1bTgLUqJvFoLRFGrrSRACJ52ghP7MtOc6utBDWaI3pi71bSGzOnEsU3zaitlgq/k/FCRiPjNTYA9basqjSl1FLmVlSZglJNxsN0ilJHaUYWm7OyGaU5pQU/MJSnlGdU8C/kjRAzbmz2CopIG0ca7w1tc0Y03h4mxS+gBju/yg0VGfmcPK/PNeWKnKcsY+6CCk2eTZ+St2ibgYRp4Ui5FUR/L9KVjJmMlxLSa2xjXcCPR14MEuA9Ga4HbHyTMdgXbJuMjEXl2IZSk6FCbGeI3SHvbLuUTI46sZ3nyAkyy7bHe1ChWsxfgF8FfgV+Hfg1+E3gR0oNtxLbnFvuEfEFfhf4HfiLwI93rPEDP77hC1UXHtYfcGNhBx7kdhSX+TrfwQ78BvyxHjPkB9/IQ/Br4dcGnY7zEOJCuY0Lfh38xvlxwa+DXxf8OviN43LBL0prXPCLcpuc/aJob6V0r2RMZXRS0pxfUP/XK+zvbPY/3z1/KYcbhE/D+MpeFrJaVMnysL1dd2fLttvWDY6HKzkazs67rv2c4DhOdm1zszt07+s7HC5yWuP8APYoC0dQ07afms3jeN7mw2PbrWcfMbi+/zA3/7bt7ifsn+umGQG73w51N148HJMjaN/hDIx+1xJZjGzr/cMIiM7LEdP6cT8WsK/HEuuP9cTb9hjz8yL5XyJ3ZfFfx/73X+df+q/DJVAv7XXx0uTI7m272dYHPNP9QGe7POAnjQ78pKXZ4WlXA51pbKDT3gZ02t4ATzoc2B80ObNO+5xVTVudXZ10O7uKG75aLb4A",
            answer: "m=edit&p=7VdNb9tGEL3rVxg8z2Fn9ls3N417cd2mTlEEhGDQthILkcyUkppChv57Z5erD46UIgUKNIeCFj183H3zZoazXC7Xj+3HNUQ+dAAFyIcOKv+CSX+qHG9nq/l0fAGX69VT27EB8NPVFbxv5svpqC6jJqOXTRxv3sDmh3FdYQUV8Q+rCWzejF82P443N7C55VsVIGPX/SBi8/XB/C3fT9arHkTF9k2x2XzH5sOse5hP76575OdxvdFQJT/f5dnJrBbtH9Oq6EjXD+3ifpaA+2bFwSyfZp/KnWVOQ7VzsYXNZS/39oxcfZCr93L1ebn0Rblv/y25cbLdctp/YcF34zpp//VghoN5O37ZJl0vlbZpqmMtfW0qgwnwR4CWI/wuOQWwRgIxAfYAeEpAOAIyKR0BVkwJKAGXgHgAopGAFaQxT9FHgBekqJQIF5UTLKhkwKiCiAeRhCskFPKQvPSlZW5Rm5MxTnrXUTIbNdDMtcVc4Xf5fJXPlM9v+QGAjR7XtTFgNFg3gZoCGASKbDoFxoGxoPnhrLUF48GEdIPAG/AWQrrivAHHzD+drnQEJAfI6wZqnxDk1YMMXzFK/OTXniBYiB5imu8RvAIXwdrEHSAgxGRGA1Fz2/QkiZYdKTdh0d9n6SqfbT5f55Be82OMgf1EzgtxAmIESvVgm/8Dke1tskA69DYrJYu9bTl2Z3rbGSDve9t7zonq7cjroNI9f2B+VfgV82PhR+anws8pJVP4U25t4bfM7wq/Y/5Q+HmNpaiLL82+XOFJ+gtOmu3Cw7kdxEW78Y7twk9+qIdisVm/Ln41+9VFp0t5KHFxuckVv04P8+OKX8d+XfHr3DAuV/xyackVv1xu8snvNq2UqXSv8tnks8sl9WmB4iVM56u+5G5Y7LJyUShdQKULKJYm2AFalW7fA1haaQ/sunYP6NJ+eyD3ozkCXGn9HWBIAkYIM1YIM06QmiCUmiiEWSumWCdH+LKW7IEghDklgnMohDkS0p0kdUFyRJFTr4RSj4LUGyE9KAmQ4AiyLsEIYUEmOXgRfghCadRiRDwZEYUXVCiUoYqidogyz7waihTwuil5UEbEy59kJpkoXltF2EgnzHTCTFZEjuRE6KhlDVCfzNJe6tHDJ3n/JuqX7dujt1L/JkrrwHaU3kAoDvttIZNRXd2sF/fT7uKm7RbNnPdft3nvdXHZde3nive71bKd3y3X3fvmgXdveTsMGXvOEwfQvG0/zWfPw3GzD89tNz17K4HTxw/nxt+33aNg/9zM5wNg+fu66YaT+33oAFp1s8F1kyM7RhbN6mkAHG1IB0zT59VQwKoZSmw+NsLb4hDzdlT9WeVfrfljQv//MfEffUykEqh/9EnxNZvPv9/NfcX24NuSk5/etjvb+gyf6X5Gz3Z5wU8anfGTlk4OT7ua0TONzajsbYZO25vBkw5n7AtNnlhlnydVstWTq5NuT66OG76ejP4C",
        },
        {
            name: "Sudoku (jigsaw)",
            puzzle: "m=edit&p=7VRdb9MwFH3vr5j87IfYSaDN2xgbL6MwNjRNUTSlXbZVS+vhpgyl6n/fuTcOaT4QIITYA0p7dXJybB9/HK+/bFKbyRCPP5aeVHi0HvM/8OhXPxeLIs+iA3m4Ke6NBZDyw8mJvE3zdTaKnSoZbctJVJ7J8l0UCyWk0PgrkcjyLNqW76NyKstzfBJSgTutRBrwuIGX/J3QUUUqD3jqMOAV4Hxh53l2fVoxH6O4vJCCxnnDrQmKpfmaCeeD3udmOVsQMUsLTGZ9v3h0X9abG/OwcVqV7GR5WNk9H7DrN3YJVnYJDdilWfxlu5Nkt8Oyf4Lh6ygm758bOG7gebRFnUZboXU902pvhO91CVZg72oiGBMRNkTYbRKywq8JDKV4wCuuJ1w11wv4kaXP9S1Xj2vI9ZQ1x7A5CbGUgYg0OvQCqZRfYeVLRVMgrLVUvqqwj8MbwBbrofneFhrPtfWg8VxbwqrWT/Yw2iqnUWirXf8a8aixgl47vRpDP3Ea9EmryRiaFsYKacztkmd4xDXg+opn/pr26bd28s8X+ad2Ypq1e7Afv4KSUSyOb+6yg6mxyzTHmZ1ulrPM1u+4JMTa5Nfrjb1N5zjyfIfgVINbsbJF5cY85otVW7e4WxmbDX4iMsPwA/qZsTed3p/SPG8R1Y3YoqrwtqjCIpl776m15qnFLNPivkXspbjVU7Yq2gaKtG0xfUg7oy2bOe9G4pvgf+zjBvb/38D/6AamLfBeWnpfmh0+vcYORh/0QPrBDqbc8b2gg+9FmgbspxrsQLDBdrMNqh9vkL2Eg/tByKnXbs7JVTfqNFQv7TTUfuDjZPQM",
            answer: "m=edit&p=7VVNj9owEL3zK1Y+++CPBEhu2y30Qmm3bFWtIoQCZJdoA9kmoVsF5b93PHESbFJpq6pqD1Vg9PLyPDO2Z+z86zHMIurCI8eUUQ6PEGP8O0z9mucuLpLIv6LXx2KXZgAo/TCd0ocwyaNBoFXLwan0/PKWlu/8gHBCiYA/J0ta3vqn8r1fzmm5gE+EcuBmtUgAnHTwC35X6KYmOQM81xjgPcBNnG2SaDWrmY9+UN5RouK8wdEKkn36LSI6D/W+SffrWBHrsIDJ5Lv4WX/Jj9v06UiaEBUtr+t0Fz3pyi5d2aYr+9MVfz5db1lVsOyfIOGVH6jcP3dw3MGFf6pUXiciRDPTem+IZDaBCtERzlgRbke49hAXFbIhIBTHgPdop2gF2jvIh5YS7Vu0DK2LdoaaCaTpubCUDvEFOGQO5VzWmEvK1RQUFoJyyWssoXgdpvXybCxomB7LQMNEh3mj984wjOVaw2Gs0P4F6zAHvdB6Pga9pzXgU2peeBaGFRKVKhg1wxu0Dtohznyk9gl28nxlhuaaNBuIi+9AeenFV2nhfrWE1LvREo7ewJbwLEJyy6m0fcixFUV6lsJhllPHduo0tdcSI9uHZ0VxbR/u0PLhjmyFPbkhM5y21VlX3uKsUuvqVHtUDQJRn4jqcV+HloOATLaP0dU8zfZhAg07P+7XUda8wwlJ8jRZ5cfsIdxAv+MBSpE7oNKgkjR9TuKDqYsfD2kW9X5SZAThe/TrNNta3l/CJDGIHK8Dg6pPLoMqsth4D7MsfTGYfVjsDOLsCDM8RYfCTKAIzRTDp9CKtu/mXA3Id4L/QML1I/9fP3/p+lFbwH7pEvr9++EVJ+m/lQ5Wb5r1tj7QPd0PbG+Xa/6i0YG/aGkV8LKrge1pbGDt3gbqsr2BvOhw4H7S5Mqr3ecqK7vVVaiLblehzhs+WA5+AA==",
        },
        {
            name: "Sudoku (killer)",
            puzzle: "m=edit&p=7VZNb9s4EL37VwQ88yCJImnrlqbJXrJps0kRBIIQyI6SGJGtVLabQob/e97wQ7Js99AWxeZQ2BbeG84MH4ccyovVffW84gofMeQBD/GJlDK/MI7NL3Cf6+myLJIjfrxaPlU1AOefzs74Q14uikHqvLLBuhklzSVv/klSFjLOIvxClvHmMlk3/ybNBW+uMMR4CNu5dYoATzt4Y8YJnVhjGABfECYCfAs8mdaTsrg7t5bPSdpcc0YTfTDhBNms+lYwJ4T4pJqNp2QY50usZvE0fXEjthLON8w2vDm2ek8O6BWdXoJWL6E9vXYZf1juKNtsUPf/IPguSUn7lw4OO3iVrPG8SNZMSAqNocVuDlMRGVRn0IIMwhsQFyIuHikyH4XaLIPJaGg5dpm48pxSE5cmr/FGilsj4Mw8I/O8hjLeCPP8aJ6BeUrzPDc+p5g4DHEYo5glEeREwMJhYQ6pxXRgpcMSWDmsgLX3xxEXEGVwBIx1Giz6OalCBktgLNpgNIXQLj/y0OIMRh7p8kjk2dYgXR6JPNLlkcgjKQ8Wd2OWeGJry+MR6hcG3BH4WKK5DAJPRiCY2ZIhlySvHSF9ROAPt9CTEAQKLYm2CNYkhZsUwSAjT5Bau9SwgvjUGjHax2jEaB+jKcaTiLQ51YZE7QgJ9doEhKpWAYQq76Yom0+gSIFbttRwox21BAm0z6axODq7lggQbIAlcUdwLrmibeqIiwEAcctW2DUlnTb4g7QJcGfSHlqiuVJOqJIjECcUwXBz64ELRpxQABA/qYKClqBUytfNEF83AIz4BKib8nWDFaSdBzG+brCC+BiUSgc+BkXUgYuBlevQxcAK4mJg9QQHNTbHVSVpiiaMJEerxHHGU7RSjC/uwFShgFQpQKqL5lpn6GVNd9BP3VL2zvmda2O7v7bFt3LSCK3bftCiv4qzQYpXH1tU5d1iVT/kE9zj5s2Iqxq2+Wo2Luqeqayql3I67/tNH+dVXRwcImNx/3jIf1zV9zvZX/Oy7BkWX1d53Q+2b6SeaVnjdbPF87quXnuWWb586hm2Xk29TMV82RewzPsS8+d8Z7ZZt+bNgH1n5pcK/K8Qf/9X/F//K2gPgvfWt+9Njjm+VX2w92E+0P6wHmxzZ9/rdNj3epom3G9rWA90Nqy7zQ3Tfn/DuNfisP2gyynrbqOTqt1ep6n22p2m2u74NBu8AQ==",
            answer: "m=edit&p=7VZNj9s2EL37VwQ68yDxa2zd0m22l23aNBsEC8FYaHedrBF7lcp2U2jh/543FMeWaPfQAEVzCGQJ8544j480h+Jm99B82imPy0xVrgpc2vtwF9aGO4/X9XK7WpQv1Mvd9rFpESj12+Wl+lCvNotJFVvNJ8/drOzeqO6XssqKTGUad5HNVfemfO5+LbvXqnuLV5kqwF31jTTCV8fwfXjP0UVPFjni1xwXfd4N4vtle79a3F71zO9l1V2rjDv6KaRzmK2bvxZZNML4vlnfLZm4q7cYzeZx+Tm+2YSZiG2L+V51L3u/F2f8mqNfc/Brzvnth/Ef253N93vM+x8wfFtW7P3dMZwew7fl8559PWfGcaqFl/7Pybxmwh8JMkwYIZBXIM/OPNMvCgrDyJye9lj32Au2EbugS3FKb4KBy/DU4XkNZ6oz4flzeObh6cLzKrR5hY6LAotR26zUsKMRmxibsEj7mBesi7FD7GPsEZO0xxI3OsYasYmxGWvyDIXYIfYxRlEYivrQcVHHQcdFHWfGHlzUcdBxUcdBx7HOntcOD/Gin1tlZ5i/IlcRkABSLs8FzAC0gKlybO/wxsQctEezQkABYAToAcCYnJkKQD9mJgDS5AVAmkSakEOSQ8ghyaHpAGj2lg+APrxho+LNwKg/OIBRL808q4mAZwda+kEz/kd7AAESNcLgSAZHBsAJsEeAdam8s0NgBBgAL8ABTAVYgIMA9kxHAkh5nwuYAWgBUzSL40ETvCkEFADSqdcDgKnyMm8ByLwhwBsRMKwm3gyrHfpBjswbWADJwVRRLjmYRMpjDlhFRS5gBhBzwArAQrVhufqyqlCE2imUirVzVaGULH7YAyuPCeSZQsjzQopojlom3oOwSw1r3Y+rPG5OWsetR8e9SIe9SA8IG7evAxH2MzcgfNzPDgTFzVIIo1PCJBrGJhrGJ8YMJcasTjSsSTSsTVNcImp9YsxSMtp+Ux0SJklxNhF1LvHhfOLDUWLdm6QXb5NevEs0vE81KPFBOkkhm6SQS3ohn/ggGo2l/zTt5cvRf+RuBl8X3mL3k0rrcLzpL/ft8XxS4ZSTbZrV7WbXfqjv8ckOhyAVuKfd+m7RjqhV03xeLZ/G7ZYfn5p2cfYVk4uHj+fa3zXtQ6L+pV6tRsTmz13djpP7w8eI2rbLEa7btvkyYtb19nFEDE4hI6XF03ZsYFuPLdaf6qS39XHM+0n2dxbuyuAIaX4cIf+vIyT/B/m/Okgeau+bT3bDI9Dw+zL4YnxfdsLybdqztQ/6TPmDPVvmkT+pdPAnNc0dnpY12DOVDTYtblCn9Q3ypMTB/UOVs2pa6OwqrXXu6qTcuathxWMH/Qo=",
        },
        {
            name: "Sudoku (thermo)",
            puzzle: "m=edit&p=7VTRTtswFH3vVyA/34fajtORN8ZgL6yDlQkhK0JpCRCR1sxNB0rVf+fY8VaSZto0bRMPU5qr0xPn3nOde7xcXZv7FcXuGtKQOK5IDP3No8jfjnfXeVGVebJHB6vqzlgAoo/Hx3STlct8oMOqdLCu95P6jOr3iWacERO4OUupPkvW9YekPqV6gkeMOLiTZpEAPNrCC//cocOG5EPgMbBkFAFeAs4KOyvzq5Mm0Wmi63Nirs5b/7aDbG6+5izocP9nZj4tHFEWi/wpkM0ehGU83VB90Cid9CiVW6UONkod6ioNrfw9pfvpZoPN/gStV4l2sj9v4ZstnCRrxLGP3MdLH499FD6eJ1oLSQKKtZQkI5KKZExRDEJFFGHT9QgzMiKFX0xKgYhBKIojimWKbiTqUf3Ox6GPyscTX+IoWTPOMVEiYonASAhgGTAKYtIa7KZOBYzSPA4Ydfjo23rMqRQBC2AZsGznlCpgBRwHHAOPQn7kUSGPQh4V8ijkealBhTwKeVTIg13gyuVBcxe+xUMfIx9j3/rIfYI/+JF+ZZd/KkcLdPr9Qke/i9OBZuPVfJrbvbGx86zEmE4e8lkBhHOALU15tVzZm2yG0fbHBEYY3MK/06JKYx7cpLfI4nZhbN77yJH59W3f+qmx153sj1lZtojll1Vm2y83Jm1RlYUDX/zPrDWPLWaeVXctYppVOCSXd8VDO1O+qNoCqqwtMbvPOtXm2543A/bE/K0lDln5/5D9p4es2/jha3Pxa5PjZ9bYXsOD7vE82F5vB37H3uB3jOwK7noZbI+dwXYdDWrX1CB3fA3uB9Z2Wbvudqq6BneldjzuSr20uU4Hzw==",
            answer: "m=edit&p=7VVRb9owEH7nV1R+9gPx+ew1b13X7qXr2sE0VRFCgaZt1EC6AGsVxH/f2fGAHJlUTdu0hynk9PHF/u6Lc2cvVrfl40oad/VlX0Z0adX3d6S1v/vhGubLIouP5Mlq+VBWBKT8eH4u79JikfWSMGrUW9fHcX0t6/dxIiIhhaI7EiNZX8fr+kNcX8l6QI+EjIi7aAYpgmc7+MU/d+i0IaM+4UvCIKQmeENwmlfTIhtfNEJXcVIPpXB53vrZDopZ+S0TwYf7Py1nk9wRRT7PXgK58GsQhkWjjaxPGqeDDqewcwpbp9DhNLzKn3N6PNpsaLE/kddxnDjbn3fwzQ4O4vXGWXIx8vHGx3MflY/DOEkUSEWOEwAJWgJKMFIbIlBLTYueWKoRK5F+RiISYYhAabQ0MKK3Acon63c+9n1EHy98irN4LaKIKkppESsqCUUYAgZfaQ12VYcBU+rIBEx5IvtjPNUpqIAVYQgY2pqAASNhE7AhbIM+6WDQQdLBoIPQ9oBBB0kHgw6tQoROZ+PKwL3iqY/aR+Nf3bpPQB9pf2lMe1GabyOUcp8VqWiabhEKRFPvW0I7wuwRGCphSxhHqD3COkLvCFCcAKYBmmkAMh9gmFOwzJhWbIoGNkVr5kMjS6sNF7XMKSo2AoFpoOZTkPlAw3ygZdaNYhoGWFqjmahBJmoMF7XMqVWcAKZhNdOwyHxYw5xa2zK2bf+mNwd7W8HQM66IN71EKX8KNBf+Oh71EnG5mk2y6uiyrGZpQZvY4Cmb5oTolBCLshgvVtVdOqWNzx8i0nNzP6dFFWX55PbBFpnfz8sq63zkyOz2vmv8pKxumfpzWhQtYvF1lVbtyc0W3qKWVd76n1ZV+dxiZunyoUVM0iUdoYuH/KmtlM2XbQPLtG0xfUxZttnunTc98SL8nQAdwfD/CP6rR7Bb+P5vPIhfc5K+4sj5t+z4mi2rzoYnuqPnie3s7cAftDfxB43sEh72MrEd7Uws72iiDpuayIO+Ju4nre1UeXc7V7zBXaqDHnep9ts8GfW+Aw==",
        },
    ],
});
