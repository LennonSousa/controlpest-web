export function cep(e: string) {
    let value = e;
    value = value.replace(/\D/g, "");
    value = value.replace(/^(\d{5})(\d)/, "$1-$2");
    e = value;
    return e;
}

export function percent(e: string) {
    let value = e;
    value = value.replace(/\D/g, "");
    value = value.replace(/(\d)(\d{1})$/, "$1,$2");
    value = value.replace(/(?=(\d{3})+(\D))\B/g, ".");

    e = value;
    return e;
}

export function currency(e: string) {
    let value = e;
    value = value.replace(/\D/g, "");
    value = value.replace(/(\d)(\d{2})$/, "$1,$2");
    value = value.replace(/(?=(\d{3})+(\D))\B/g, ".");

    e = value;
    return e;
}

export function prettifyCurrency(e: string) {
    if (!e) {
        e = '0,00';
        return e;
    }
    let newText = e.replace(/(\D)/g, '').replace(/^0+/, '');

    if (newText.length < 3) {
        for (let i = newText.length; i < 3; i++) {
            newText = '0' + newText;
        }
    }
    newText = newText
        .replace(/(\d{2}$)/g, ',$&')
        .replace(/(\d{1})(\d{3})([,])/, '$1.$2$3')
        .replace(/(\d{1})(\d{3})([.])/, '$1.$2$3')
        .replace(/(\d{1})(\d{3})([.])/, '$1.$2$3');

    e = newText;
    return e;
}

export function cellphone(e: string) {
    let value = e;
    if (!value.match(/^\([1-9]{2}\) (?:[2-8]|9[1-9])[0-9]{3}\-[0-9]{4}$/)) {
        value = value.replace(/\D/g, "");
        value = value.replace(/^(\d{2})(\d)/g, "($1) $2");
        value = value.replace(/(\d)(\d{4})$/, "$1-$2");
        e = value;
    }
    return e;
}

export function cpf(e: string) {
    let value = e;
    if (!value.match(/^(\d{3}).(\d{3}).(\d{3})-(\d{2})$/)) {
        value = value.replace(/\D/g, "");
        value = value.replace(/(\d{3})(\d)/, "$1.$2");
        value = value.replace(/(\d{3})(\d)/, "$1.$2");
        value = value.replace(/(\d{3})(\d{2})$/, "$1-$2");
        e = value;
    }
    return e;
}

export function cnpj(e: string) {
    let value = e;
    if (!value.match(/^(\d{2}).(\d{3}).(\d{3})\/(\d{4})-(\d{2})$/)) {
        value = value.replace(/\D/g, "");
        value = value.replace(/(\d{2})(\d)/, "$1.$2");
        value = value.replace(/(\d{3})(\d)/, "$1.$2");
        value = value.replace(/(\d{3})(\d)/, "$1/$2");
        value = value.replace(/(\d{2})(\d{2})$/, "$1-$2");
        e = value;
    }
    return e;
}