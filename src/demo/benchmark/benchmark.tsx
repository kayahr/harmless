import { For, render } from "@kayahr/harmless";
import { type Getter, type Setter, batch, createArraySignal, createSignal } from "@kayahr/signal";
import type { JSX } from "../../main/jsx.ts";

const adjectives = [
    "pretty", "large", "big", "small", "tall", "short", "long", "handsome", "plain", "quaint", "clean", "elegant", "easy", "angry", "crazy", "helpful",
    "mushy", "odd", "unsightly", "adorable", "important", "inexpensive", "cheap", "expensive", "fancy"
];
const colors = [ "red", "yellow", "blue", "green", "pink", "brown", "purple", "brown", "white", "black", "orange" ];
const nouns = [ "table", "chair", "house", "bbq", "desk", "car", "pony", "cookie", "sandwich", "burger", "pizza", "mouse", "keyboard" ];

const random = (max: number) => Math.round(Math.random() * 1000) % max;

let nextId = 1;

interface Data {
    id: number;
    label: Getter<string>;
    setLabel: Setter<string>;
}

const buildData = (count: number) => {
    const data = Array.from<Data>({ length: count });
    for (let i = 0; i < count; i++) {
        const [ label, setLabel ] = createSignal(
            `${adjectives[random(adjectives.length)]} ${colors[random(colors.length)]} ${nouns[random(nouns.length)]}`
        );
        data[i] = { id: nextId++, label, setLabel };
    }
    return data;
};

const Button = ({ id, children, fn }: { id: string, children: JSX.Element, fn: () => unknown }) => (
    <div class="col-sm-6 smallpad">
        <button id={id} class="btn btn-primary btn-block" type="button" on:click={fn}>
            {children}
        </button>
    </div>
);

document.getElementById("main")?.appendChild(render(() => {
    const [ data, array ] = createArraySignal<Data>([]);
    const [ selected, setSelected ] = createSignal<number | null>(null);
    const run = () => array.replace(buildData(1_000));
    const runLots = () => array.replace(buildData(10_000));
    const add = () => array.push(...buildData(1_000));
    const update = () =>
        batch(() => {
            for (let i = 0, d = data(), len = d.length; i < len; i += 10) {
                d[i]?.setLabel(l => `${l} !!!`);
            }
        });
    const clear = () => array.replace([]);
    const swapRows = () => {
        const items = data();
        if (items.length > 998) {
            const item = items.at(1)!;
            batch(() => {
                array.set(1, items.at(998)!);
                array.set(998, item);
            });
        }
    };

    return (
        <div class="container">
            <div class="jumbotron">
                <div class="row">
                    <div class="col-md-6">
                        <h1>Harmless</h1>
                    </div>
                    <div class="col-md-6">
                        <div class="row">
                            <Button id="run" fn={run}>Create 1,000 rows</Button>
                            <Button id="runlots" fn={runLots}>Create 10,000 rows</Button>
                            <Button id="add" fn={add}>Append 1,000 rows</Button>
                            <Button id="update" fn={update}>Update every 10th row</Button>
                            <Button id="clear" fn={clear}>Clear</Button>
                            <Button id="swaprows" fn={swapRows}>Swap Rows</Button>
                        </div>
                    </div>
                </div>
            </div>
            <table class="table table-hover table-striped test-data">
                <tbody>
                    <For of={data} key={item => item.id}>
                        {row => {
                            const item = row();
                            const rowId = item.id;
                            return (
                                <tr class={() => selected() === rowId ? "danger" : ""}>
                                    <td class="col-md-1">{rowId}</td>
                                    <td class="col-md-4">
                                        <a on:click={() => setSelected(rowId)}>{item.label}</a>
                                    </td>
                                    <td class="col-md-1">
                                        <a on:click={() => array.splice(data().findIndex(d => d.id === rowId), 1)}>
                                            <span class="glyphicon glyphicon-remove" aria-hidden="true" />
                                        </a>
                                    </td>
                                    <td class="col-md-6" />
                                </tr>
                            );
                        }}
                    </For>
                </tbody>
            </table>
            <span class="preloadicon glyphicon glyphicon-remove" aria-hidden="true" />
        </div>
    );
}));
