import Vue from "vue";
import Vuetify from "vuetify";
import "vuetify/dist/vuetify.min.css";

Vue.use(Vuetify);

export default new Vuetify({
    theme: {
        themes: {
            light: {
                primary: "#607d8b",
                secondary: "#009688",
                accent: "#4caf50",
                error: "# e91e63",
                warning: "#cddc39",
                info: "#3f51b5",
                success: "#8bc34",
            },
        },
    },
});