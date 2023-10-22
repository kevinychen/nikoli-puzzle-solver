import { Bool } from "z3-solver";
import { Constraints, Context, Point, Puzzle, Solution, Symbol, ValueMap } from "../lib";

const solve = async ({ And, Implies, Not, Or, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Draw diagonal lines through the center of some cells to divide the board into regions
    // Two lines cannot overlap within a cell
    const values = ["\\", "/"];
    const grid = new ValueMap(puzzle.points, _ => cs.choice(values));

    // All lines must be drawn from one corner to the opposite corner of the cell
    for (const vertex of puzzle.points.vertices()) {
        const [p1, p2, p3, p4] = vertex.sort(Point.compare);
        cs.add(Sum(grid.get(p1).is("\\"), grid.get(p2).is("/"), grid.get(p3).is("/"), grid.get(p4).is("\\")).neq(1));
    }

    // A cell with a number cannot overlap a line
    for (const [p] of puzzle.texts) {
        cs.add(grid.get(p).eq(-1));
    }

    // Find which edges are connected to which
    const edges = (p: Point) =>
        puzzle.lattice.edgeSharingPoints(p).map(q => Point.center(...puzzle.lattice.edgeVertices(p, q)));
    const edgeNeighborPairs: [Point, Point, Bool][] = [];
    for (const [p, arith] of grid) {
        const [e1, e2, e3, e4] = edges(p).sort(Point.compare);
        edgeNeighborPairs.push([e1, e2, Not(arith.is("\\"))]);
        edgeNeighborPairs.push([e1, e3, Not(arith.is("/"))]);
        edgeNeighborPairs.push([e2, e4, Not(arith.is("/"))]);
        edgeNeighborPairs.push([e3, e4, Not(arith.is("\\"))]);
    }
    const edgeNeighbors = new ValueMap([...puzzle.points].flatMap(edges), _ => []);
    for (const [edge1, edge2, isNeighbor] of edgeNeighborPairs) {
        edgeNeighbors.get(edge1).push([edge2, isNeighbor]);
        edgeNeighbors.get(edge2).push([edge1, isNeighbor]);
    }

    // Find the region of each edge
    const edgeRegions = new ValueMap(edgeNeighbors.keys(), _ => cs.int());
    for (const [edge1, neighbors] of edgeNeighbors) {
        for (const [edge2, isNeighbor] of neighbors) {
            cs.add(Implies(isNeighbor, edgeRegions.get(edge1).eq(edgeRegions.get(edge2))));
        }
    }

    // Each region must contain exactly one of each kind of number on the board
    const rootNumber = puzzle.texts.values().next().value;
    const trees = new ValueMap(edgeNeighbors.keys(), _ => cs.int());
    for (const [edge1, neighbors] of edgeNeighbors) {
        const isRoot = puzzle.lattice.cellsWithEdge(edge1).some(p => puzzle.texts.get(p) === rootNumber);
        cs.add(
            Or(
                isRoot,
                ...neighbors.map(([edge2, isNeighbor]) => And(isNeighbor, trees.get(edge2).lt(trees.get(edge1))))
            )
        );
    }
    for (const [p, text1] of puzzle.texts) {
        for (const [q, text2] of puzzle.texts) {
            if (!p.eq(q) && text1 === text2) {
                cs.add(edgeRegions.get(edges(p)[0]).neq(edgeRegions.get(edges(q)[0])));
            }
        }
    }

    const model = await cs.solve(grid);

    // Fill in solved slant lines
    for (const [p, arith] of grid) {
        const value = values[model.get(arith)];
        if (value === "\\") {
            solution.symbols.set(p, Symbol.NW_TO_SE);
        } else if (value === "/") {
            solution.symbols.set(p, Symbol.NE_TO_SW);
        }
    }
};

solverRegistry.push({
    name: "Slash Pack",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VRPb5tOEL3zKaI974H/Tril+cW9uLSp/VMUIWStbRKjgDddoKnW8nfP7EADu9BDK7XNoVrt6PEYZt4Ab6svDRMZDWF559SmDiw3DHE7vo/b7tYqr4ssOqOXTb3nAgClH+dzes+KKrOSLiu1jvIikjdUvo8S4hBKXNgOSam8iY7yQyRjKpdwi1AHuEWb5AK87uEt3lfoqiUdG3DcYYB3ALe52BbZetEyn6JErihRfd7h0wqSkn/NSKdDXW95uckVsWE1DFPt86fuTtXs+GPT5TrpicrLVu5yQq7Xy1WwlavQhFw1xW+We5GeTvDaP4PgdZQo7f/38LyHy+gIMY6OxHW/T9p+G+J6ioBP9UoEivAGxMx4xPONDN8s6odG0cDsEmDRQY0QawwyZthlUHSGRV8fgYEcHOsO4xyji3EFU1PpYfwPo40xwLjAnGuMtxivMPoYQ8yZqff2U2/2D8hJXBdt2q7g13FqJSRuyk0mzmIuSlYQMC+peLGuGnHPtvArorfhbwPugJkaVXD+VOQHPS9/OHCRTd5SZLZ7mMrfcLEzqj+zotCI9qzSqNZUGlULcMzgmgnBnzWmZPVeIwbu0iplh1oXUDNdIntkRreyn/lkkW8Ed+LByej9Oxn/0smoPoH91lz81uTg38vFpPWBnnA/sJMu7/iR0YEfWVo1HLsa2AljA2t6G6ixvYEcORy4H5hcVTV9rlSZVletRm5XrYaGT1LrBQ==",
            answer: "m=edit&p=7VRNb9swDL37VxQ66xBLttz61nbNLlm2LhmKwggCJ3Ebo3bU+WMtHPi/j6KdJpK8wwbs4zAIIugninyS/Fh+reMioQIGP6cj6sJgQuB0PQ/nqB/ztMqS8Ixe1tVWFuBQ+nE8pg9xViZO1EctnH1zETa3tHkfRsQllDCYLlnQ5jbcNx/CZkqbGSwR6gI26YIYuDdH9w7XlXfdge4I/Gnvg3sP7jot1lmynHTIpzBq5pSoOle4W7kkl98S0vNQ32uZr1IFrOIKDlNu0+d+paw38qkmhxItbS47urMBuvxIl7/R5cN02e+ne7FoW7j2z0B4GUaK+5eje350Z+G+Vbz2hLHDSbu3IYwrgJ0AvgL4CRAYW7hnRHhmUk8YSX2zih8YOQQzIgLPSBoIbQscyMVj3aMdo2Vo53Bq2nC079CO0PpoJxhzg/YO7TVaD63AmEDdG9zsaQ5h7Z6i7Vh0FWYHRoQp+j4l8nV5hS9PuDqh0BBuxfgm4ll5PN/M4wUm4jNzl29l9oW5S1h8hGfFWHmEnSfQY96eRF1360SMYbvphv/r/sKJyLTOV0lxNpVFHmcEmhApZbYs6+IhXoOksEdRxHYYqUGZlM9ZutPj0sedLJLBJQUmm8eh+JUsNkb2lzjLNKDEnqtBXXPQoKpIte+4KOSLhuRxtdWAky6hZUp2lU6ginWK8VNsVMuPZ24d8kpwRhw6PP/f4f9Sh1dPMPqpPv9HmuO/RQf/XlkMSh/gAfUDOqjyHreEDrglaVXQVjWgA8IG1NQ2QLa8AbQUDtgPRK6ymjpXrEypq1KW2lWpU8FHC+c7",
        },
    ],
});
