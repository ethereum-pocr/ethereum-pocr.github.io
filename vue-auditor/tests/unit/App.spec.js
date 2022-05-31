import { createLocalVue, mount } from "@vue/test-utils";
import Vuetify from "vuetify";
import App from "@/App.vue";
import store from "@/store";
describe("App.vue", () => {
    const localVue = createLocalVue();
    let vuetify;

    beforeEach(() => {
        vuetify = new Vuetify();
    });
    test("render the application landing page and check app title", () => {
        const wrapper = mount(App, {
            localVue,
            vuetify,
            store,
        });

    });
});