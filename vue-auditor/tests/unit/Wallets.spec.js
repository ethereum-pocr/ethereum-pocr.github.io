import { createLocalVue, mount } from "@vue/test-utils";
import Vuetify from "vuetify";
import Wallets from "@/components/Wallets.vue";
import store from "@/store";
describe("Wallets.vue", () => {
    const localVue = createLocalVue();
    let vuetify;

    beforeEach(() => {
        vuetify = new Vuetify();
    });
    test("render the application landing page and check app title", () => {
        const wrapper = mount(Wallets, {
            localVue,
            vuetify,
            store,
            propsData: {},
        });
        const itemTitles = wrapper.find(".v-card__title");
        expect(itemTitles.text()).toBe(
            "Add a wallet already under this custody service"
        );
    });
});