import Choices from "choices.js";
import { isEqual } from "lodash";
import { init } from "z3-solver";
import { fromPenpaUrl, newSolution, toPenpaUrl, toPuzzle } from "./internal/penpa";
import { ConstraintsImpl, PuzzleSolver, ValueMap } from "./lib";

interface PenpaEditWindow {
    pu: any;
    load: (url: string) => void;
}

declare global {
    var initPromise: ReturnType<typeof init>;
    var cleanupFunc: (args: any) => void;
    var solverRegistry: PuzzleSolver[];
    var exp: () => string;
    var imp: (url: string) => void;
    var penpaEditWindow: PenpaEditWindow & WindowProxy;
    var solve: (
        puzzleName: string,
        url: string,
        parameters: string,
        differentFrom: ValueMap<any, number>
    ) => Promise<[string, ValueMap<any, number>]>;
    var initSolverUI: () => void;
}

global.initPromise = init().then(z3 => {
    // z3 lib calls del_context in the finalizer, but we want to free memory immediately because
    // the finalizer isn't guaranteed to run. But del_context isn't idempotent, so we call it
    // ourselves and clear the actual cleanup functions so that the finalizer doesn't run them.
    global.cleanupFunc = z3.Z3.del_context;
    z3.Z3.ast_map_dec_ref = () => {};
    z3.Z3.ast_vector_dec_ref = () => {};
    z3.Z3.del_context = () => {};
    z3.Z3.dec_ref = () => {};
    z3.Z3.func_entry_dec_ref = () => {};
    z3.Z3.func_interp_dec_ref = () => {};
    z3.Z3.model_dec_ref = () => {};
    z3.Z3.optimize_dec_ref = () => {};
    z3.Z3.solver_dec_ref = () => {};
    z3.Z3.tactic_dec_ref = () => {};
    return z3;
});

// Dynamically load all solvers
global.solverRegistry = [];
const requireContext = require.context("./solvers", false, /.*\.ts/);
requireContext.keys().forEach(requireContext);
solverRegistry.sort((a, b) => a.name.localeCompare(b.name));
console.log(`Loaded ${solverRegistry.length} solvers`);

global.solve = async (puzzleName: string, url: string, parameters: string, differentFrom: ValueMap<any, number>) => {
    const penpa = fromPenpaUrl(url, parameters);
    const z3 = await initPromise;
    const z3Context = z3.Context("main");
    const _Sum = z3Context.Sum;
    const context = Object.assign(z3Context, {
        Sum: (...args: any) => _Sum(cs.int(0, 0), ...args),
    });
    const solution = newSolution();
    let newValues: ValueMap<any, number> = undefined;
    const cs = new ConstraintsImpl(differentFrom, context, new context.Solver(), values => (newValues = values));
    return solverRegistry
        .find(({ name }) => name === puzzleName)
        .solve(context, toPuzzle(penpa), cs, solution)
        .finally(() => global.cleanupFunc(z3Context.ptr))
        .then(() => [toPenpaUrl(penpa, solution), newValues]);
};

global.initSolverUI = async function () {
    // Export and import a Penpa URL, starting from the "m=edit&p=".
    // These are global variables so that they can be easily used for debugging.
    global.exp = () => penpaEditWindow.pu.maketext().split("#")[1];
    global.imp = (url: string) => penpaEditWindow.load(url);

    global.penpaEditWindow = (document.getElementById("iframe") as any).contentWindow;

    const sampleSelect = document.getElementById("sample") as HTMLSelectElement;
    const typeSelect = document.getElementById("type") as HTMLSelectElement;
    const parametersTextarea = document.getElementById("parameters") as HTMLTextAreaElement;
    const solveButton = document.getElementById("solve") as HTMLButtonElement;

    let prevFoundUrl: string = undefined;
    let prevFoundValues: ValueMap<any, number> = undefined;

    const sampleOptions = [];
    const typeOptions = [];
    for (const { name, keywords, samples } of solverRegistry) {
        typeOptions.push({
            label: name,
            value: name,
            customProperties: { keywords },
        });
        for (const { name: sampleName } of samples) {
            sampleOptions.push({
                label: sampleName || name,
                value: sampleName || name,
                customProperties: { keywords },
            });
        }
    }
    const sampleChoices = new Choices(sampleSelect, {
        allowHTML: false,
        choices: sampleOptions,
        placeholder: true,
        searchFields: ["label", "customProperties.keywords"],
    });
    const typeChoices = new Choices(typeSelect, {
        allowHTML: false,
        choices: typeOptions,
        placeholder: true,
        searchFields: ["label", "customProperties.keywords"],
    });

    sampleSelect.addEventListener("change", () => {
        const {
            name,
            parameters,
            sample: { puzzle, parameters: sampleParameters },
        } = solverRegistry
            .flatMap(({ name, parameters, samples }) => samples.map(sample => ({ name, parameters, sample })))
            .find(({ name, sample }) => (sample.name || name) === sampleSelect.value);
        imp(puzzle);
        typeChoices.setChoiceByValue(name);
        sampleChoices.setChoiceByValue("");
        parametersTextarea.value = sampleParameters || parameters;
        parametersTextarea.style.display = parameters ? "block" : "none";
    });

    typeSelect.addEventListener("change", () => {
        const { parameters } = solverRegistry.find(({ name }) => name === typeSelect.value);
        parametersTextarea.value = parameters;
        parametersTextarea.style.display = parameters ? "block" : "none";
    });

    solveButton.addEventListener("click", () => {
        if (solveButton.classList.contains("disabled")) {
            return;
        }
        if (!typeSelect.value) {
            alert("Choose a puzzle type to solve as.");
            return;
        }
        solveButton.textContent = "Solving…";
        solveButton.classList.add("disabled");

        const url = exp();
        if (url !== prevFoundUrl) {
            prevFoundValues = undefined;
        }

        setTimeout(() => {
            solve(typeSelect.value, url, parametersTextarea.value, prevFoundValues)
                .then(([url, values]) => {
                    console.log("Solved:", url);
                    penpaEditWindow.load(url);
                    prevFoundUrl = exp();
                    prevFoundValues = values;
                })
                .catch((e: Error) => {
                    console.log(e);
                    alert(e.message);
                })
                .finally(() => {
                    solveButton.textContent = exp() === prevFoundUrl ? "Find another solution" : "Solve";
                    solveButton.classList.remove("disabled");
                });
        }, 0);
    });

    penpaEditWindow.document.addEventListener("click", () => penpaEditWindow.focus());

    setInterval(() => {
        if (
            prevFoundUrl !== undefined &&
            prevFoundUrl !== exp() &&
            !solveButton.classList.contains("disabled") &&
            !isEqual(toPuzzle(fromPenpaUrl(prevFoundUrl, "")), toPuzzle(fromPenpaUrl(exp(), "")))
        ) {
            imp(toPenpaUrl(fromPenpaUrl(exp(), ""), newSolution()));
            prevFoundValues = undefined;
            prevFoundUrl = undefined;
            solveButton.textContent = "Solve";
        }
    }, 1000);
};
