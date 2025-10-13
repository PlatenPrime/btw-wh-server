export function sortArtsByArtikul(arts) {
    return arts.sort((a, b) => a.artikul.localeCompare(b.artikul));
}
