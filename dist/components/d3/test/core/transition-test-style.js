require("../env");var assert=require("assert");module.exports={topic:function(){var e=this.callback,t=d3.select("body").append("div").style("background-color","white").style("color","red").style("display","none").style("font-size","20px"),n=t.transition().style("display",null).style("font-size",function(){return null}).style("display",null).style("background-color","green").style("background-color","red").style("color",function(){return"green"},"important").each("end",function(){e(null,{selection:t,transition:n})})},"defines the corresponding style tween":function(e){assert.typeOf(e.transition.tween("style.background-color"),"function"),assert.typeOf(e.transition.tween("style.color"),"function")},"the last style operator takes precedence":function(e){assert.equal(e.selection.style("background-color"),"#ff0000")},"sets a property as a string":function(e){assert.equal(e.selection.style("background-color"),"#ff0000")},"sets a property as a function":function(e){assert.equal(e.selection.style("color"),"#008000")},"observes the specified priority":function(e){var t=e.selection.node().style;assert.equal(t.getPropertyPriority("background-color"),""),assert.equal(t.getPropertyPriority("color"),"important")},"removes a property using a constant null":function(e){assert.equal(e.selection.style("display"),"")},"removes a property using a function null":function(e){assert.equal(e.selection.style("font-size"),"")}}