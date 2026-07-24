const estados = {};

function definirEstado(usuario, estado) {
    estados[usuario] = estado;
}

function obterEstado(usuario) {
    return estados[usuario];
}

function limparEstado(usuario) {
    delete estados[usuario];
}

module.exports = {
    definirEstado,
    obterEstado,
    limparEstado
};