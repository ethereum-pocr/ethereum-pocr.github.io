import { createLocalVue, mount } from "@vue/test-utils";
import Vuetify from "vuetify";
import Transactions from "@/components/Transactions.vue";
import store from "@/store";
describe("Transactions.vue", () => {
    const localVue = createLocalVue();
    let vuetify;

    beforeEach(() => {
        vuetify = new Vuetify();
    });
 
    test("render the application landing page and check app title", () => {
        const wrapper = mount(Transactions, {
            localVue,
            vuetify,
            store,
            propsData: {},
        });
        const itemTitles = wrapper.find(".v-card__title");
        expect(itemTitles.text()).toBe( "Transaction 1" );
    });
});