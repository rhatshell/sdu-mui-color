// import { delay } from 'rxjs/operator/delay';
// import {filter} from 'rxjs/operators';
// import { map } from 'rxjs/operator/map';
import {
  CHANGE_COLOR_ASYNC
} from '../constants';
import { changeColor } from '../actions/color';
const { filter, delay, map } = window.RxOps;

export default function colorEpic$(action$) {
  return action$.pipe(
    filter(action => action.type === CHANGE_COLOR_ASYNC),
    delay(1000),
    map(action => changeColor(action.color))
  );
}
