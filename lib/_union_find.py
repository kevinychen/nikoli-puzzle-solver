class UnionFind:
    def __init__(self):
        self.parents = {}

    def union(self, x, y):
        self.parents[self.find(x)] = self.find(y)

    def find(self, x):
        if x not in self.parents or self.parents[x] == x:
            return x
        self.parents[x] = self.find(self.parents[x])
        return self.parents[x]
