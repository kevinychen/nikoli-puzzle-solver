import { Constraints, Context, Puzzle, Solution, ValueMap } from "../lib";

const solve = async ({ Implies, Or, Sum }: Context, puzzle: Puzzle, cs: Constraints, solution: Solution) => {
    // Place a number into some of the cells
    const grid = new ValueMap(puzzle.points, _ => cs.int());

    // Some numbers are given
    for (const [p, text] of puzzle.texts) {
        cs.add(grid.get(p).eq(parseInt(text)));
    }

    // Each number must be equal to the amount of cells with numbers inside the outlined region
    const regions = puzzle.regions();
    for (const [p, arith] of grid) {
        cs.add(Implies(arith.neq(0), Sum(...regions.get(p).map(p => grid.get(p).neq(0))).eq(arith)));
    }

    // Every region must contain at least one number
    for (const region of regions) {
        cs.add(Or(...region.map(p => grid.get(p).neq(0))));
    }

    // Two equal numbers from different regions cannot be orthogonally adjacent
    for (const [p, q] of puzzle.points.edges()) {
        if (puzzle.borders.has([p, q])) {
            cs.add(Or(grid.get(p).eq(0), grid.get(p).neq(grid.get(q))));
        }
    }

    // Numbers cannot form a 2x2 square
    for (const vertex of puzzle.points.vertices()) {
        cs.add(Or(...vertex.map(p => grid.get(p).eq(0))));
    }

    // All numbers form an orthogonally contiguous area
    cs.addAllConnected(puzzle.points, p => grid.get(p).neq(0));

    const model = await cs.solve(grid);

    // Fill in solved numbers
    for (const [p, arith] of grid) {
        const value = model.get(arith);
        if (value === 0) {
            solution.shaded.add(p);
        } else if (!puzzle.texts.has(p)) {
            solution.texts.set(p, value.toString());
        }
    }
};

solverRegistry.push({
    name: "Nanro",
    solve,
    samples: [
        {
            puzzle: "m=edit&p=7VbPb9w2E73vXxHozAN/SaJ0y5favbjbpvaHIFgsDNlW4kW0VqrdbQoZ/t/zhuJQ0u4WRVG0zaEQRMwMhzOPwzcSd78cqq4WDo9xQgqFx1jtXy0L/8rw3Gz2TV2+Eq8P+8e2gyDEj5eX4kPV7OrFKnitF899UfZvRf99uUpUIhKNVyVr0b8tn/sfyn4p+mtMJULBdjU4aYgXQSTzO+9A1jeDVUnIyyBDfA/xftPdN/Xt1WD5qVz1NyKhRP/zq0lMtu2vdRKAkH7fbu82ZLir9tjN7nHzOczsDg/tp0PwVesX0b8e8F6fwWtGvCQOcEk6A5d28TfDLdYvL6j7zwB8W64I+/9H0Y3idfmMcVk+JzqjpRmwDIeTGEMGMxqcPDIoeeyilCULDniwILbyGd778dKP2o83ACB648fv/Cj9mPrxyvtcAJdKc6FSl5SaQqYOSsFKIVQGUF7JQNVMsQLWZpoVDQVIB8VAAchBsVBSVlKh8jwoOZI6zuOI9SE0BBAyRIMgtA4BIAhtQgAIQtsQAILQjE0D6KhgCzCw4gQMrCAAb1unGRQOnSJPitMaFAuFEaSAk4bNaQugKQPVyGM5qUJozXkkoinedoEAkgviUMSC60ankHFBMhTeca3JzXGtc5zCTMnZLSc3juZwCo5PweEUHCfNaWaq5OyWk1vYNlwmCh1wdHMZUDNdClRUcXkVCq8YToGCRMVhcwVvLqfQXBCiS85wEG10ozWO8zjkkZxHUp5QAwioNR+JJrpEhWYikbBGT9dEimkcsOHTNuCBZVJYJI3cwTAGIIXad1iDpGaaNCo0Y5k7FjywnMdSHuabJSrHpES+OANsYwBiYgSKPDbmITiMzWCnhplIiuUZ+sFE9tIay1uwxOuYh2Z4jQRQxdgUCmL4ewAqq4JJUQCbjNwBXaYzqoiMpzXxtMGDgtcUxComBZEvKgWqI2MzgVU6UgzYJGOT5DZVFK9RWBMLoqk68RiJFDEaCi+58LTTIQC+ku/8t/KNH60fM/8NzekT/6d+An/9c/2HcFYalZw9KOY/qa8Xq+Ti4WP9atl226rBz3N52N7VHeu4riS7trndHboP1T3+vf42g98rbE/ec2Zq2vZzs3ma+20+PrVdfXaKjDXSn/G/a7uHo+hfqqaZGYbb2cw03CJmpn2HK8JEr7qu/TKzbKv948wwuU7MItVP+zmAfTWHWH2qjrJtxz2/LJLfEv+uDO6C5r+74L91F6QzkN/ax+Bbg+Pp23Znex/mM+0P69k2D/aTTof9pKcp4Wlbw3qms2E9bm6YTvsbxpMWh+13upyiHjc6oTrudUp10u6Uatrxq/XiKw==",
            answer: "m=edit&p=7VdLb+M2EL77Vyx05oHDl0jfttuklzTtNlsUCyMIlMS7MdaOtrLdLRz4v3eG1EgU7QItij4OhWGK36fhN0Ny+ND2533TLYXHn/ZCCsCfNir+lQzxL/vfu9VuvZy/Eq/3u6e2w4oQ311eig/NerucLXqr29nLIcwPb8Xhm/migkpUCv9Q3YrD2/nL4dv54VocbvBVJQC5q2SksHrRV4n+KRoQ+yaxILF+3dex+h6rD6vuYb28u0rM9/PF4Z2oyNFXsTVVq037y7LqAyH80G7uV0TcNzvszfZp9bl/s90/tp/2Fbs4isPrFO/NmXj1GK8ewtXnw1V/f7jh9njEcf8BA76bLyj2H8eqH6s385cjxfVSKUdNHcaSJqfSmgg9El4WBMjSBMAQo5hBbYge3sfyMpYqlu8wAHHQsfw6ljKWNpZX0eYC4wJbC7C+miuStB5BYBAEONkDh6nqgAFmrVMMFALNQCMwDAwCy8AKqOse1OjUsx9PWd9LYwUTslfDilCqF8CKULoXwIpQphfAilAcm8JAR2DpjWTgheLOKey24m4r6xCwtEU/1jEwCDgCi+FYw04xUMuBKvRj2CmgtGI/EtWAux1QQPKAeBzEwONGs+B4QBwOvIfMzPNY17IANZvVZMZqHmfB8yx4nAXPTmtdgJrNajJz3MZmgCZ4MPMOo+Z0CTiiwMMLOPDA4YSQAY+dC9y5mqR5QChdajuqjWbUxrMfj34k+5HkR7FT3DUVT4nSOaA3OotN5W2GFFM4wZpnW2MeGE4K47PcwWIUIKBZQKNTnTsdAL0xnDsG88CwH0N+ON9MnTu1WSYakwuYLC01+jGDHwqHY9PYUw0ZMPyGDhibtzHcBaOzJKe8HtpIDBQ4NsAB0bwfYCpD4KQIGJscckdN30AYMl5nIGAeBG4TKKs4KSj5BhBqOhI5HMwqBWMbJTk2WRcAuA2EbECUzIaKwKiGAy/rrKdJ4EhnDe2Vb2JpYuniHlrTFo+HQL7Huunuynu/7/d+1e/jtDtMCC1LAvqTZiBUfxYMRCmqQ9HElKJGlRa2ELWysLC6JPgEGghXaDhdWDhTaDhXWtSlhS9E61KjtoVGXWr4OIQmI04sQqERyu4HKOIIuhANpQbIUgQknNiYQhekLYQBTnTgRAfK6QEoxwWgnigPd4Z0H7ih/EQLTHs6wOih08PEh02kVelh0yM1cIl0iaTjCx+1Sw+fHon0ifSJDKldSAhkggD8JOPhUpMuMrQIj7OFcvHCPP7sP4tvZ4vq4vHj8tV1222aNV4Nr/eb+2XHGC/j1bZd32333YfmAW+W8a4uIvccLSfUum0/r1fPU7vVx+e2W559ReQS3Z+xv2+7x0L9S7NeT4ht/PaYUOmOPKF23WqCm65rv0yYTbN7mhDZZXmitHzeTQPYNdMQm09N4W0z9vk4q36t4n+h8UtH//+l82996dAcyD/1vfPXv0z+wMn73wonpm/bnV37SJ9Z/sieXeY9f7LSkT9Z0+TwdFkje2ZlI1subqRO1zeSJ0scud9Z5aRaLnSKqlzr5OpkuZOrfMUvbme/AQ==",
        },
    ],
});
