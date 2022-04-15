import { createLocalVue, mount } from "@vue/test-utils";
import Vuetify from "vuetify";
import AppMenu from "@/components/AppMenu.vue";
import store from "@/store";
describe("AppMenu.vue", () => {
    const localVue = createLocalVue();
    let vuetify;

    beforeEach(() => {
        vuetify = new Vuetify();
    });
    test("render the application landing page and check app title", () => {
        const wrapper = mount(AppMenu, {
            localVue,
            vuetify,
            store,
            propsData: {
                value: "wallets",
            },
        });
        const itemTitles = wrapper.findAll(".v-list-item__title");
        expect(itemTitles.length).toBe(2);
    });
});