import data from '../../data/estados-cidades.json';

export interface StateCitiesItem {
    estados: State[];
}

export interface State {
    sigla: string;
    nome: string;
    cidades: string[];
}

export const statesCities: StateCitiesItem = data;