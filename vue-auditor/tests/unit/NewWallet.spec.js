import { createLocalVue, mount } from "@vue/test-utils";
import Vuetify from "vuetify";
import NewWallet from "@/components/NewWallet.vue";
import store from "@/store";

describe("NewWallet.vue", () => {
    const localVue = createLocalVue();
    let vuetify;

    beforeEach(() => {
        vuetify = new Vuetify();
    });

    test("render the application landing page and check app subtitle", () => {
        const wrapper = mount(NewWallet, {
            localVue,
            vuetify,
            store,
            propsData: {},
        });
        const itemTitles = wrapper.find(".v-card__subtitle");
        expect(itemTitles.text()).toBe(
            "Warning, do not lose the password !"
        );      
    });
});