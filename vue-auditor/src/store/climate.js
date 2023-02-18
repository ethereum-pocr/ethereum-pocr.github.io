import { make } from "vuex-pathify";

const state = () => ({
    indicators: [],
    totalWeight: 1,
    efDecimals: 6,
})

const getters = {
    fromSingleIndicator: (state) => (si)=>{
        return reverseSingleIndicator(si, state.indicators, state.totalWeight, state.efDecimals)
    },
    toSingleIndicator: (state) => (values)=>{
        return calculateSingleIndicator(values, state.indicators, state.totalWeight, state.efDecimals)
    }
}

const mutations = make.mutations(state);

function processIndicators(conf) {
    if (!conf) throw new Error("Invalid configuration")
    if (! Array.isArray(conf.indicators)) throw new Error("The indicators field is missing or is not an array")
    const indicators = [];
    for (const indicator of conf.indicators) {
        indicators.push({
            name: indicator.name || "missing name",
            definition: indicator.definition || "missing definition",
            unit: indicator.unit || "missing unit",
            normalisationFactor : indicator.normalisationFactor || 1,
            weight : indicator.weight || 0
        })
    }

    const totalWeight = indicators.reduce( (p, i)=>i.weight+p, 0);
    if (totalWeight == 0) throw new Error("Cannot work with a set of indicators whose total weigth is zero")

    return {indicators, totalWeight, efDecimals: conf.efDecimals || 6};
}

function reverseSingleIndicator(si, indicators, totalWeight, efDecimals) {
    // if (totalWeight == 0) throw new Error("Cannot work with a total weight of zero")
    // It is not possible from a single indicator to retrieve the 4 indicators from the weight only.
    // So this function project the single indicator as if it was all on a one indicator
    si = si / Math.pow(10, efDecimals);
    const result = indicators.map( i=> {
        // const w = i.weight / totalWeight;
        // const c = si * w ;
        const v = si * i.normalisationFactor / i.weight;
        return {...i, valueEq: v};
    })
    return result;
}

function calculateSingleIndicator(indicatorValues, indicators, totalWeight, efDecimals) {
    let si = 0;
    // console.log("calculateSingleIndicator", indicatorValues)
    for(let index=0; index<indicators.length; index++) {
        const i = indicators[index];
        const v = indicatorValues.length>index ? indicatorValues[index] : 0;
        const c = v * i.weight / i.normalisationFactor;
        //const w = i.weight / totalWeight;
        si += c ;
    }
    return si * Math.pow(10, efDecimals);
}

const actions = {
    async fetchIndicators({ commit }) {
        try {
            let envUrl = "./envirnonmental.json";
            const url = new URL(window.location.href);
            if (url.searchParams.has("envirnonmental")) {
                const uConf = new URL(url.searchParams.get("envirnonmental"));
                envUrl = uConf.href;
                url.searchParams.delete("envirnonmental")
            }
            const res = await fetch(envUrl)
            if( res.status === 200 ) {
                const config = await res.json();
                const processed = processIndicators(config);
                
                commit("indicators", processed.indicators)
                commit("totalWeight", processed.totalWeight)
                commit("efDecimals", processed.efDecimals)
            }
        } catch (error) {
            console.error("Could not process the environmental configuration", error.message)
            commit("indicators", [])
            commit("totalWeight", 1)
        }
    },

}

export default {
    state,
    getters,
    mutations,
    actions,
    namespaced: true
}