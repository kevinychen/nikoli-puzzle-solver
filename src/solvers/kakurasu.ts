import { Constraints, Context, Puzzle, Solution, ValueMap, Vector } from "../lib";

const solve = async ({ If, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Shade some cells on the board
    const grid = new ValueMap(puzzle.points, _ => cs.int(0, 1));

    // Each row and column has a certain value, indicated by the circled numbers in the right and bottom of the grid
    // The numbers at the top indicate the sum of the values of the rows which have a shaded cell in that column
    // The numbers on the left indicate the sum of the values of the columns which have a shaded cell in that row
    for (const [p, v] of puzzle.points.entrances()) {
        if (puzzle.texts.has(p) && [Vector.E, Vector.S].some(w => w.eq(v))) {
            cs.add(
                Sum(...puzzle.points.sightLine(p.translate(v), v).map((p, i) => If(grid.get(p).eq(1), i + 1, 0))).eq(
                    parseInt(puzzle.texts.get(p))
                )
            );
        }
    }

    const model = await cs.solve(grid);

    // Fill in solved shaded cells
    for (const [p, arith] of grid) {
        if (model.get(arith)) {
            solution.shaded.add(p);
        }
    }
};

solverRegistry.push({
    name: "Kakurasu (Index Sums)",
    keywords: ["Box"],
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7ZRBb5tMEIbv/hXRnvcAxsY2tzRf3IvrNrWrKELIWtskRgFvukBTreX/nplZvsACPVRV2xyqNaPxs8POu8C7+ddSqJhPYHhT7nAXhueM6PId/P0/1kmRxsEFvyyLg1SQcP5xPuf3Is3jQejSvU40OOlZoG+4fh+EzGWcDeFyWcT1TXDSHwK95HoFU4y7wBamaAjpdZ3e0jxmVwa6DuTLKof0DtJdonZpvFkY8ikI9Zoz7POO7saUZfJbzCod+H8ns22CYCsK2Ex+SJ6qmbzcy8eyqnWjM9eXRu6qR65Xy8XUyMWsRy7u4jfLnUXnMzz2zyB4E4So/UudTut0FZwgLoMTG47pVgfEmJfDhj4ReFmvZNKpmSIZN8AMwbQGntNexaNOsxqMTCN8ShUZm0ajmvjUyK/BhBo1VplRo1cA23Jpc3cU5xSHFNewd649iv9RdCiOKS6o5priLcUriiOKPtVM8On91PP9A3JCzyermvELeTQI2bLMtrG6WEqViZSBhVku001eqnuxgw+SHA7fHLAjVVoolfIpTY52XfJwlCrunUIY7x/66rdS7VurP4s0tYA5ryxkrGWhQoFvGv+FUvLZIpkoDhZoeMxaKT4WtoBC2BLFo2h1y+o9nwfsO6Mr9OCE9P6dj3/pfMRX4Lw1F781OfT1StVrfcA97gfa6/KKd4wOvGNpbNh1NdAeYwNtextQ194AOw4H9gOT46ptn6OqttWxVcft2Kpp+DAavAA=",
            answer: "m=edit&p=7ZRNc5swEIbv/IqMzjoAwnzd0jTuxXWb2p1MhmE82CYxE7BSAU0HD/+9qxUJFtBDp9OPQ0dmtTxaaVfCr8ovdSJS6kFjPjWpBY2ZDj6uKX8vbZ1VeRpe0Mu6OnABDqUf5nN6n+RlakQWzjVj49QEYXNDm3dhRCxCiQ2PRWLa3ISn5n3YLGmzgiFCLWALFWSDe927tzguvSsFLRP8ZeeDewfuLhO7PN0sFPkYRs2aEpnnDc6WLin415R0dcj3HS+2mQTbpILNlIfsqRsp6z1/rMlLipY2l6rc1US5rC+XvZbLpsu1f3+5Qdy2cOyfoOBNGMnaP/eu37ur8NTKuk7EnuFUE4pRH4fYLhL7jHijGF+S2RkIJPB7wMzhKgwzBT1wVCKrJzOVyOmJi4ncHnjBYJXA1ABsy8LN3aGdo7XRrmHvtGFo36I10c7QLjDmGu0t2iu0DloXYzx5enC+52u4o9lLtKoKlQGOmzDYCZToWKrr3gLsZjZ2rqm67o2pToV4asxT03015jvYBQoGal4Ax2q9HoDatNxQa0TMRVGr9gt+bERkWRfbVFwsuSiSnIDYScnzTVmL+2QHf128CyiyI0ZqKOf8Kc+Oelz2cOQinRySMN0/TMVvudgPVn9O8lwDJd5sGlIi1FAlMu09EYI/a6RIqoMGztSorZQeK72AKtFLTB6TQbai33NrkG8En4jBXcr+36R/6SaVn8D8qfv0j1w//1Y5+O/lYlL6gCfUD3RS5R0fCR34SNIy4VjVQCeEDXSobUBjeQMcKRzYD0QuVx3qXFY1lLpMNVK7THUu+Cg2vgM=",
        },
    ],
});
