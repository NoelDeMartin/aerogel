import { defineServiceState } from '@/services/Service';

interface State {
    environment: typeof __AG_ENV;
}

export default defineServiceState<State>({
    initialState: { environment: __AG_ENV },
});
