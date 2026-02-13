const initialState = {
  dateType: "",
  date: "",
  time: "",
  location: "",
  name: ""
};

let state = { ...initialState };

export function getState() {
  return state;
}

export function setState(patch) {
  state = { ...state, ...patch };
  return state;
}

export function resetState() {
  state = { ...initialState };
  return state;
}
