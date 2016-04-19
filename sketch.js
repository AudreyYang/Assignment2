/*To do: the position and color of Legend, the style of button, the text on html, the comma of amount.
 */
var table;
var tablecopy;
var table2;
var particleSystem = [];
var investorSystem = [];
var attractors = [];
var aggregated = {};
var connections = [];
var investors = [];
var companiesToDisplay = [];
var investorsToDisplay = [];
var investorsParticles = [];
var investorsAggregated = [];
var button;

function preload() {
    table = loadTable("data/investments.csv", "csv", "header");
    tablecopy = loadTable("data/investmentscopy.csv", "csv", "header");
    table2 = loadTable("data/companies_categories.csv", "csv", "header");
}


function setup() {
    var canvas = createCanvas(windowWidth, windowHeight);
    frameRate(30);


    button = createButton('back');
    button.position(width / 2 - 60, height / 2 + 300);
    button.mousePressed(goBack);
    button.hide();

    colorMode(HSB, 360, 100, 100, 100);
    //background(0);
    //textSize(10);
    textAlign(CENTER);
    //textStyle(BOLD);

    //print(table.getRowCount() + " total rows in table");

    /* replace \, by ""
    aggregates usd amounts per company invested 
    by using the object aggregated  */
    for (var r = 0; r < tablecopy.getRowCount(); r++) {
        var cname = tablecopy.getString(r, "company_name");
        var invested = tablecopy.getString(r, "amount_usd");
        var investorname = tablecopy.getString(r, "investor_name")
        invested = parseInt(invested);
        if (!isNaN(invested)) {
            if (aggregated.hasOwnProperty(cname)) {
                aggregated[cname] = aggregated[cname] + invested;
            } else {
                aggregated[cname] = invested;
            }

            if (investorsAggregated.hasOwnProperty(investorname)) {
                investorsAggregated[investorname] = investorsAggregated[investorname] + invested;
            } else {
                investorsAggregated[investorname] = invested;
            }
        }
    }



    /* converts the object into an array of companies */
    var aAggregated = [];
    Object.keys(aggregated).forEach(function (name_) {
        var company = {};
        company.name = name_;
        company.sum = aggregated[name_]
        aAggregated.push(company);
    });


    /* sorts the array by usd amount */
    aAggregated.sort(function (companyA, companyB) {
        return companyB.sum - companyA.sum;
    });

    aAggregated = aAggregated.slice(0, 100);

    var investors = [];
    Object.keys(investorsAggregated).forEach(function (name) {
        var investor = {};
        investor.name = name;
        investor.sum = investor[name];
        investors.push(investor);
    });

    //create an investorParticle per each investor, put the investor inside the particle and the particle inside the investors
    investors.forEach(function (iv) {
        var particle = new investorParticle(iv.name, iv.sum, iv.investor);
        iv.particle = particle;
        investorsParticles.push(particle);
    });

    for (var r = 0; r < tablecopy.getRowCount(); r++) {
        var cname = tablecopy.getString(r, "company_name");
        var invested = tablecopy.getString(r, "amount_usd");
        var investorname = tablecopy.getString(r, "investor_name")
        invested = parseInt(invested);

        var foundCompany = aAggregated.find(function (element) {
            return element.name == cname;
        });

        if (foundCompany) {

            var foundInvestor = investors.find(function (element) {
                return element.name == investorname;
            });

            if (foundInvestor) {

                var connection = {};
                connection.company = foundCompany;
                connection.investor = foundInvestor;
                connection.amount = invested;
                connections.push(connection);

            }

        }

    }
    //console.log(connections);
    /* prints the top company */
    //print(aAggregated[0].name + " : " +aAggregated[0].sum);


    /* creates 100 particles from the array */
    for (var i = 0; i < aAggregated.length; i++) {
        var p = new Particle(aAggregated[i].name, aAggregated[i].sum);
        particleSystem.push(p);
        companiesToDisplay.push(p)
            //print(p);
    }

    /*for(var i =0; i<connections.length; i++){
        var p = new Investor(connections[i].investor.name, 5);
        investorsToDisplay.push(p);
    }*/



    /* COUNT THE NUMBER OF CATEGORIES */
    var ob = {}; //this is the counts
    for (var i = 0; i < table2.getRowCount(); i++) {
        var catName = table2.getString(i, "category_code");
        if (ob.hasOwnProperty(catName)) {
            ob[catName]++;
        } else {
            ob[catName] = 1;
        }
    };




    /* creates a central atractor of strength 1 */
    var at = new Attractor(createVector(width / 2, height / 2), 1);
    attractors.push(at);


    //print(companiesToDisplay);



}


function draw() {
    background(0, 0, 100);


    /*checks for pairs of particles*/
    for (var STEPS = 0; STEPS < 4; STEPS++) {
        for (var i = 0; i < particleSystem.length - 1; i++) {
            for (var j = i + 1; j < particleSystem.length; j++) {
                var pa = particleSystem[i];
                var pb = particleSystem[j];
                var ab = p5.Vector.sub(pb.pos, pa.pos);
                var distSq = ab.magSq();
                if (distSq <= sq(pa.radius + pb.radius)) {
                    var dist = sqrt(distSq);
                    var overlap = (pa.radius + pb.radius) - dist;
                    ab.div(dist); //ab.normalize();
                    ab.mult(overlap * 0.5);
                    pb.pos.add(ab);
                    ab.mult(-1);
                    pa.pos.add(ab);

                    pa.vel.mult(0.97);
                    pb.vel.mult(0.97);

                }
            }
        }

    }



    for (var i = companiesToDisplay.length - 1; i >= 0; i--) {
        var p = companiesToDisplay[i];
        p.update();
        p.draw();
    }

    investorsToDisplay.forEach(function (investorParticle) {
        investorParticle.update();
        investorParticle.draw();
    });

    drawLegend();


}

/*COMPANY PARTICLES HERE*/
var Particle = function (name, sum, category) {
    this.name = name;
    this.sum = sum;

    this.category = category

    this.radius = sqrt(sum) / 4000;
    var initialRadius = this.radius;

    var isMouseOver = false;
    var maximumRadius = 65;

    var tempAng = random(TWO_PI);
    this.pos = createVector(cos(tempAng), sin(tempAng));
    this.pos.div(this.radius);
    this.pos.mult(1000);
    this.pos.set(this.pos.x + width / 2, this.pos.y + height / 2);
    this.vel = createVector(0, 0);
    var acc = createVector(0, 0);

    var rowCat = table2.findRow(this.name, "name");

    if (rowCat != null) {
        this.categoryName = rowCat.get("category_code");
    } else {
        //print(this.name);
    }
    //print (rowCat);

    switch (this.categoryName) {
    case "software":
        this.color = {
            h: 232,
            s: 20,
            b: 100

        };
        break;
    case "web":
        this.color = {
            h: 0,
            s: 24,
            b: 100
        };
        break;
    case "biotech":
        this.color = {
            h: 76,
            s: 45,
            b: 100
        };
        break;
    case "mobile":
        this.color = {
            h: 196,
            s: 37,
            b: 100
        };
        break;
    case "enterprise":
        this.color = {
            h: 25,
            s: 36,
            b: 100
        };
        break;
    case "ecommerce":
        this.color = {
            h: 215,
            s: 44,
            b: 99
        };
        break;
    default:
        this.color = {
            h: 196,
            s: 5,
            b: 98
        };
    }

    this.update = function () {
        checkMouse(this);

        attractors.forEach(function (A) {
            var att = p5.Vector.sub(A.pos, this.pos);
            var distanceSq = att.magSq();
            if (distanceSq > 1) {
                att.normalize();
                att.div(10);
                //att.mult(this.radius*this.radius/200);
                acc.add(att);
            }
        }, this);
        this.vel.add(acc);
        this.pos.add(this.vel);
        acc.mult(0);
    }

    this.draw = function () {
        noStroke();
        if (isMouseOver) {
            fill(0, 100, 50);
        } else {
            fill(0, 0, 50);
        }

        fill(this.color.h, this.color.s, this.color.b);
        ellipse(this.pos.x,
            this.pos.y,
            this.radius * 2,
            this.radius * 2);

        if (this.radius !== initialRadius) {

            fill(this.color.h, this.color.s, this.color.b - 5);
            ellipse(this.pos.x,
                this.pos.y,
                this.radius * 2,
                this.radius * 2);
        }

        if (this.radius == maximumRadius) {

            push();

            fill(0, 0, 20);
            textSize(12);
            text(this.name, this.pos.x, this.pos.y);

            fill(this.color.h, this.color.s, this.color.b - 20);
            textSize(10);
            text(nfc(this.sum), this.pos.x, this.pos.y + 25);

            fill(this.color.h, this.color.s, this.color.b - 20);
            strokeWeight(0);
            textSize(8);
            text(this.categoryName, this.pos.x, this.pos.y + 35);

            pop();

        }
    }

    function checkMouse(instance) {
        var mousePos = createVector(mouseX, mouseY)
        
        if (mousePos.dist(instance.pos) <= instance.radius) {
            incRadius(instance);
            isMouseOver = true;
        } else {
            decRadius(instance);
            isMouseOver = false;
        }

    }

    function incRadius(instance) {
        instance.radius += 4;
        if (instance.radius > maximumRadius) {
            instance.radius = maximumRadius;
        }

    }

    function decRadius(instance) {
        instance.radius -= 4;
        if (instance.radius < initialRadius) {
            instance.radius = initialRadius;
        }
    }

    this.getMouseOver = function () {
        return isMouseOver;
    }

    //drawLegend();
}



/*INVESTOR PARTICLES HERE*/
var investorParticle = function (name, sum, investor) {

    var minimumRadius = 1000;

    this.invename = name;
    this.sum = sum;
    //this.radius = sqrt(sum) / 1000;
    this.investor = investor;
    this.amount = 10;

    var tempAng = random(TWO_PI);
    this.pos = createVector(cos(tempAng), sin(tempAng));
    this.pos.div(this.radius);
    this.pos.mult(10000);
    this.pos.set(this.pos.x + width / 2, this.pos.y + height / 2);
    this.vel = createVector(0, 0);
    var acc = createVector(0, 0);

    //this.pos = createVector(random(0, width), random(0, height));

    var isMouseOver = false;

    this.update = function () {

        this.radius = sqrt(this.amount) / 4000
            /* if(this.radius > this.minimumRadius){
                  this.radius = sqrt(this.amount) / 4000
             }else{
                 this.radius = minimumRadius
             }*/


    }


    this.draw = function () {
        var c = {
            h: 100,
            s: 100,
            b: 100
        };
        if (companiesToDisplay.length == 1) {
            var c = companiesToDisplay[0].color
        };

        noFill();

        strokeWeight(1);
        stroke(c.h, c.s, c.b - 10);
        ellipse(this.pos.x - 20, this.pos.y - 25, this.radius * 6, this.radius * 6);
        fill(0, 0, 40);
        noStroke();
        textSize(8);
        text(this.invename, this.pos.x, this.pos.y);
    }
}




function mouseClicked() {
    var clickedCompany = null;
    companiesToDisplay.forEach(function (co) {
        if (co.getMouseOver()) clickedCompany = co;
    });


    if (clickedCompany != null) {
        companiesToDisplay = [];
        companiesToDisplay.push(clickedCompany);
        button.show();
    }
    /*else {
           companiesToDisplay = [];
           particleSystem.forEach(function (p) {
               companiesToDisplay.push(p);
           })
       };*/

    investorsToDisplay = [];
    connections.forEach(function (c) {
            //the invested amount should be c.amount
            if (clickedCompany != null) {
                if (c.company.name == clickedCompany.name) {
                    if (!investorsToDisplay.includes(c.investor.particle)) {
                        investorsToDisplay.push(c.investor.particle);
                        c.investor.particle.amount = c.amount;
                    } else {
                        c.investor.particle.amount += c.amount;
                    }
                }
            }
        })
        //console.log(investorsToDisplay);

    var ang = 0;

    investorsToDisplay.forEach(function (p) {
        p.pos.x = width / 2 + cos(ang) * 300;
        p.pos.y = height / 2 + sin(ang) * 300;
        ang += TWO_PI / investorsToDisplay.length;
    });

};

function goBack() {
    companiesToDisplay = [];
    particleSystem.forEach(function (p) {
        companiesToDisplay.push(p);
    });
}






var Attractor = function (pos_, s) {
    this.pos = pos_.copy();
    var strength = s;
    this.draw = function () {
        noStroke();
        fill(0, 100, 100);
        ellipse(this.pos.x, this.pos.y,
            strength, strength);
    }
}


function drawLegend() {
    var arr = [
        {
            text: 'Enterprise',
            color: '#ffc9a4'
        },
        {
            text: 'Web',
            color: '#FFC3C3'
        },
        {
            text: 'Software',
            color: '#ccd3ff'
        },
        {
            text: 'Ecommerce',
            color: '#8dbcfc'
        },
        {
            text: 'Mobile',
            color: '#A1E7FF'
        },

        {
            text: 'Biotech',
            color: '#e0ff8c'
        },
        {
            text: 'Others',
            color: '#edf7fa'
        }
    ];

    arr.forEach(function (e, i) {
        var ty = 330;
        var tx = 60
        textAlign(LEFT);
        fill(e.color);
        noStroke();

        ellipse(tx - 12, ty - 3 + i * 20, 10, 10);
        textSize(8);
        text(e.text, tx, ty + i * 20);

    });

    var ty = 200;
    var tx = - 30;
    fill('#8dbcfc');
    ellipse(tx + 100, ty + 300 , 30, 30);
    textSize(8);
    text("Company", tx + 82, ty + 330);
    textSize(8);
    text("Investor", tx + 136, ty + 330);

    noFill();
    stroke('#8dbcfc');
    strokeWeight(1);
    ellipse(tx + 150, ty + 300 , 30, 30);

 
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);

}