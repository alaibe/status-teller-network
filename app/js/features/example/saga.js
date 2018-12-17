import { fork, takeEvery } from 'redux-saga/effects';
import { EXAMPLE } from './constants';

export function *doExample() {
  yield console.log("example");
}

export function *onExample() {
  yield takeEvery(EXAMPLE, doExample);
}

export default [fork(onExample)];
