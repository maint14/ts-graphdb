import { readFileSync } from "fs";

import {_female, _male, _surname, SOME_CONNECTION_PAIR_TYPE_VALUES} from "./arrays"

const _femaleArray = _female
const _maleArray = _male
const _surnameArray = _surname


type Person = {
  name: string,
  surname: string,
  age: number
}

export const randInt = (minimum, maximum) => Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
export const isEven = (n: number) => n % 2 == 0;

const createPeopleArray: (many: number) => Person[] = (many) => {
  const array : Person[] = [];
  const choose = randInt(1,100);

  for (let i: number = 0; i < many; i++) {
    array.push({
      name: isEven(choose) ? _maleArray[randInt(0, _maleArray.length-1)] : _femaleArray[randInt(0, _femaleArray.length-1)],
      surname: _surnameArray[randInt(0, _surnameArray.length-1)],
      age: randInt(14,101),
    })
  }

  return array;
}


export default createPeopleArray;
export {
  SOME_CONNECTION_PAIR_TYPE_VALUES
}