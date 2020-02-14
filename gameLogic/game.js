function getDeck(){
    var cards = ["2C","3C","4C","5C","6C","7C","8C","9C","10C","JC","QC","KC","AC",
             "2C","3C","4C","5C","6C","7C","8C","9C","10C","JC","QC","KC","AC",
             "2D","3D","4D","5D","6D","7D","8D","9D","10D","JD","QD","KD","AD",
             "2D","3D","4D","5D","6D","7D","8D","9D","10D","JD","QD","KD","AD",
             "2H","3H","4H","5H","6H","7H","8H","9H","10H","JH","QH","KH","AH", 
             "2H","3H","4H","5H","6H","7H","8H","9H","10H","JH","QH","KH","AH",
             "2S","3S","4S","5S","6S","7S","8S","9S","10S","JS","QS","KS","AS",
             "2S","3S","4S","5S","6S","7S","8S","9S","10S","JS","QS","KS","AS",
             "$J","$J","$J","$J"];
    return cards;
}

function shufflePack(pack) {
    var i = pack.length, j, tempi, tempj;
    if (i === 0) return false;
    while (--i) {
        j = Math.floor(Math.random() * (i + 1));
        tempi = pack[i];
        tempj = pack[j];
        pack[i] = tempj;
        pack[j] = tempi;
     }
    return pack;
}

function draw(pack, amount, hand, initial) {
    var cards = new Array();
    cards = pack.slice(0, amount); 
    pack.splice(0, amount); 
    if (!initial) {
      hand.push.apply(hand, cards);
    }
    return cards;
}
  
function playCard(amount, hand, index) {
    hand.splice(index, amount)
    return hand;
}

function deckScan(arr){
    return arr.includes('x');
}

function compare(element1, element2){
    return (element1 === element2)? true: false;
}

function compare2Cols(element1, element2, element3, element4){
    return ((element1 === element2) && (element2 === element3) && (element3 === element4))? true: false;
}

function getScore(playerHand){
    let cardInfo = [
        {attr: '$', point: -2},
        {attr: 'K', point: 0},
        {attr: 'A', point: 1},
        {attr: '2', point: 2},
        {attr: '3', point: 3},
        {attr: '4', point: 4},
        {attr: '5', point: 5},
        {attr: '6', point: 6},
        {attr: '7', point: 7},
        {attr: '8', point: 8},
        {attr: '9', point: 9},
        {attr: '1', point: 10},
        {attr: 'J', point: 10},
        {attr: 'Q', point: 10},
        {attr: 'x', point: 0},
    ];
    let col1 = 0;
    let col2 = 0;
    let col3 = 0;
    let slot1 = playerHand[0].toString();
    let slot2 = playerHand[1].toString();
    let slot3 = playerHand[2].toString();
    let slot4 = playerHand[3].toString();
    let slot5 = playerHand[4].toString();
    let slot6 = playerHand[5].toString();

    if(compare2Cols(slot1[0], slot4[0], slot2[0], slot5[0]) && (slot1[0] !== 'x' && slot4[0] !== 'x' && slot2[0] !== 'x' && slot5[0] !== 'x')){
        col1 = -10;
        col2 = -10;
    }
    if(compare2Cols(slot2[0], slot5[0], slot3[0], slot6[0]) && (slot2[0] !== 'x' && slot5[0] !== 'x' && slot3[0] !== 'x' && slot6[0] !== 'x')){
        col2 = -10;
        col3 = -10;
    }
    if(!compare(slot1[0], slot4[0]) || (slot1[0] === '$' && slot4[0] === '$')){
        let idx1 = cardInfo.map((data)=> {return data.attr;}).indexOf(slot1[0]);
        let idx2 = cardInfo.map((data)=> {return data.attr;}).indexOf(slot4[0]);
        col1 = parseInt(cardInfo[idx1].point)+parseInt(cardInfo[idx2].point);
    }
    if(!compare(slot2[0], slot5[0]) || (slot2[0] === '$' && slot5[0] === '$')){
        let idx1 = cardInfo.map((data)=> {return data.attr;}).indexOf(slot2[0]);
        let idx2 = cardInfo.map((data)=> {return data.attr;}).indexOf(slot5[0]);
        col2 = parseInt(cardInfo[idx1].point)+parseInt(cardInfo[idx2].point);
    }
    if(!compare(slot3[0], slot6[0]) || (slot3[0] === '$' && slot6[0] === '$')){
        let idx1 = cardInfo.map((data)=> {return data.attr;}).indexOf(slot3[0]);
        let idx2 = cardInfo.map((data)=> {return data.attr;}).indexOf(slot6[0]);
        col3 = parseInt(cardInfo[idx1].point)+parseInt(cardInfo[idx2].point);
    }
    return parseInt(col1)+parseInt(col2)+parseInt(col3);
}

exports.getDeck = getDeck;
exports.shufflePack = shufflePack;
exports.draw = draw;
exports.playCard = playCard;
exports.deckScan = deckScan;
exports.getScore = getScore;