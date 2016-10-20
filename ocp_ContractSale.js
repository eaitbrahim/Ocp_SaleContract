function SaleLookup_OnChange() {
    importSalesDate = Xrm.Page.getAttribute("new_importsalesdata").getValue();
    if (importSalesDate == true) {
	DisableSalesInputs();
        var saleLookup = new Array();
        saleLookup = Xrm.Page.getAttribute("new_sale").getValue();
        
        if (saleLookup != null) {
            var saleId = saleLookup[0].id;
            saleId = saleId.replace('{', '').replace('}', '');
            retrieveRecord(saleId, "OpportunitySet", retrieveSaleCompleted, null);
        }
    }
}

function retrieveSaleCompleted(data, textStatus, XmlHttpRequest) {
    //Get back the Sale JSON object
    if (data != null) {
        var effectiveStartDate = moment.utc(parseInt(data["new_StartDate"].match(/\d+/)[0])).format();
        Xrm.Page.getAttribute("new_account").setValue([{ id: data["CustomerId"].Id, name: data["CustomerId"].Name, entityType: "account"}]);
        Xrm.Page.getAttribute("new_destinationcountry").setValue([{ id: data["new_country"].Id, name: data["new_country"].Name, entityType: "new_pays"}]);
        Xrm.Page.getAttribute("new_incoterm").setValue(data["new_FreightTerms"].Value);
        Xrm.Page.getAttribute("new_effectivestartdate").setValue(effectiveStartDate);
        Xrm.Page.getAttribute("new_shippingtolerance").setValue(Number(data["new_tolerance"]));
        Xrm.Page.getAttribute("new_paymentterm").setValue(data["new_PaymentTerm"].Name);
        Xrm.Page.ui.controls.get("new_paymentterm").setVisible(true);
        Xrm.Page.getAttribute("new_loadingport").setValue([{ id: data["new_PortDestination"].Id, name: data["new_PortDestination"].Name, entityType: "new_ports"}]);
        Xrm.Page.getAttribute("new_dischargeport").setValue([{ id: data["new_Portofdischarge"].Id, name: data["new_Portofdischarge"].Name, entityType: "new_ports"}]);
        
        if (data["new_SalesType"].Value == "100000000") {
            Xrm.Page.getAttribute("new_agreementtype").setValue("100000000");
            //selectedSaleType = "100000000"; // Spot
        } else if (data["new_SalesType"].Value == "100000001") {
            Xrm.Page.getAttribute("new_agreementtype").setValue("100000004");
            //selectedSaleType = "100000004"; // Long term
        } else {
            Xrm.Page.getAttribute("new_agreementtype").setValue("100000001");
            Xrm.Page.getAttribute("new_quarter").setValue(getQuarter(effectiveStartDate));
            Xrm.Page.getAttribute("new_year").setValue([{ name: effectiveStartDate.getFullYear(), entityType: "new_years"}]);
            //selectedSaleType = "100000001"; // Quartely
        }

        // Get related data of product...
        if (data["new_productid"].Id != null) {
            Xrm.Page.getAttribute("new_product").setValue([{ id: data["new_productid"].Id, name: data["new_productid"].Name, entityType: "product"}]);
            Xrm.Page.getAttribute("new_totalquantity").setValue(Number(data["new_Quantity"]));
            if (data["new_priceperunit"].Value != null && data["new_freightperunit"].Value != null) {
                Xrm.Page.getAttribute("new_price").setValue(parseFloat(eval(data["new_priceperunit"].Value)) + parseFloat(eval(data["new_freightperunit"].Value)));
            }
            retrieveRecord(data["new_productid"].Id, "ProductSet", retrieveProductFamilyCompleted, null);
        }
    }
    else {
        alert("No sale matches the selected sale!");
        initializeSalesData();
    }
}

function getQuarter(d) {
    var q = [0, 1, 2, 3];
    var qVal = ["100000000", "100000001", "100000002", "100000003"]
    return qVal[q[Math.floor(d.getMonth() / 3)]];
}

function retrieveProductFamilyCompleted(data, textStatus, XmlHttpRequest) {
    //Get back the Sale JSON object
    if (data != null) {
        Xrm.Page.getAttribute("new_productfamily").setValue([{ id: data["new_ProductFamily"].Id, name: data["new_ProductFamily"].Name, entityType: "new_productfamily"}]);
        Xrm.Page.getAttribute("new_productcategory").setValue([{ id: data["new_ProductCategory"].Id, name: data["new_ProductCategory"].Name, entityType: "new_productcategory"}]);
    }
    // Invoke code from new_agreement.js
    SetAgreementType();
    setLookup_ProductCategory(true);
    ContractNumber_change();
}

function ContractType_OnChange() {
    initializeSalesData();
    EnableOrDisableSalesInputs();
    FilterSalesView();
    AgreementType_onChange();
}

function FilterSalesView(){
	var contractType = Xrm.Page.getAttribute("new_agreementtype").getValue();
	// Long Term Agreement
	if (contractType == "100000004") {
		Xrm.Page.getControl("new_sale").setDefaultView("37904EF4-5465-E611-838C-005056976E09");
	} 	
	// Display spot type
	if (contractType == "100000000" || contractType == "100000002") { 
	    Xrm.Page.getControl("new_sale").setDefaultView("0ED57BDD-8959-E611-A56A-0050569738F0");
	}
	// Display quartely type
	if (contractType == "100000001" || contractType == "100000003") { 
	    Xrm.Page.getControl("new_sale").setDefaultView("AB8AE2D9-5465-E611-838C-005056976E09");
	}
}

function EnableOrDisableSalesInputs(){
	EnableSalesInputs();
	var importSalesDate = Xrm.Page.getAttribute("new_importsalesdata").getValue();
	if (importSalesDate == true) {
		var contractType = Xrm.Page.getAttribute("new_agreementtype").getValue();
		if (contractType != "100000004") {// Long Term Agreement
			DisableSalesInputs();
		}
	}
}

function DisableSalesInputs(){
	Xrm.Page.ui.controls.get("new_account").setDisabled(true);
	Xrm.Page.ui.controls.get("new_destinationcountry").setDisabled(true);
	Xrm.Page.ui.controls.get("new_incoterm").setDisabled(true);
	Xrm.Page.ui.controls.get("new_effectivestartdate").setDisabled(true);
	Xrm.Page.ui.controls.get("new_shippingtolerance").setDisabled(true);
	Xrm.Page.ui.controls.get("new_paymentterm").setDisabled(true);
	Xrm.Page.ui.controls.get("new_totalquantity").setDisabled(true);
	Xrm.Page.ui.controls.get("new_product").setDisabled(true);
	Xrm.Page.ui.controls.get("new_price").setDisabled(true);
}

function EnableSalesInputs(){
	Xrm.Page.ui.controls.get("new_account").setDisabled(false);
        Xrm.Page.ui.controls.get("new_destinationcountry").setDisabled(false);
        Xrm.Page.ui.controls.get("new_incoterm").setDisabled(false);
        Xrm.Page.ui.controls.get("new_effectivestartdate").setDisabled(false);
        Xrm.Page.ui.controls.get("new_shippingtolerance").setDisabled(false);
        Xrm.Page.ui.controls.get("new_paymentterm").setDisabled(false);
        Xrm.Page.ui.controls.get("new_totalquantity").setDisabled(false);
        Xrm.Page.ui.controls.get("new_product").setDisabled(false);
        Xrm.Page.ui.controls.get("new_price").setDisabled(false);
}

function SaleType_OnChange() {
    initializeContractsData();
    Xrm.Page.getAttribute("new_agreementid").setValue(null);
    var saleType = Xrm.Page.getAttribute("new_salestype").getValue();

    if (saleType == "100000001") {// Long Term Agreement
        Xrm.Page.ui.controls.get("new_agreementid").setDisabled(false);
    } else {
        Xrm.Page.ui.controls.get("new_agreementid").setDisabled(true);
    }
}

function ContractLookup_OnChange() {
    initializeContractsData();
    importContractsDate = Xrm.Page.getAttribute("new_importcontractsdata").getValue();
    if (importContractsDate == true) {
        var contractLookup = new Array();
        contractLookup = Xrm.Page.getAttribute("new_agreementid").getValue();
        if (contractLookup != null) {
            var contractId = contractLookup[0].id;
            contractId = contractId.replace('{', '').replace('}', '');

            retrieveRecord(contractId, "new_agreementSet", retrieveContractCompleted, null);

        } 
    }
}

function retrieveContractCompleted(data, textStatus, XmlHttpRequest) {
    //Get back the Sale JSON object
    if (data != null) {
        Xrm.Page.getAttribute("customerid").setValue([{ id: data["new_account"].Id, name: data["new_account"].Name, entityType: "account"}]);
        Xrm.Page.getAttribute("new_country").setValue([{ id: data["new_destinationcountry"].Id, name: data["new_destinationcountry"].Name, entityType: "new_pays"}]);
        Xrm.Page.getAttribute("new_freightterms").setValue(data["new_incoterm"].Value);
        Xrm.Page.getAttribute("new_startdate").setValue(new Date(data["new_effectivestartdate"].match(/\d+/)[0] * 1));
        Xrm.Page.getAttribute("new_tolerance").setValue(Number(data["new_shippingtolerance"]));
if(data["new_paymentterm"] != null){
        Xrm.Page.getAttribute("new_paymentterm").setValue([{ name: data["new_paymentterm"].Name, entityType: "new_paymentsterms"}]);
}        
Xrm.Page.getAttribute("new_quantity").setValue(Number(data["new_totalquantity"]));
        Xrm.Page.getAttribute("new_productid").setValue([{ id: data["new_product"].Id, name: data["new_product"].Name, entityType: "product"}]);
        Xrm.Page.getAttribute("new_portdestination").setValue([{ id: data["new_loadingport"].Id, name: data["new_loadingport"].Name, entityType: "new_ports"}]);
        Xrm.Page.getAttribute("new_portofdischarge").setValue([{ id: data["new_dischargeport"].Id, name: data["new_dischargeport"].Name, entityType: "new_ports"}]);
    }
    else {
        alert("No contract matches the selected contract!");
        initializeContractsData();
    }
}

function openContractSale() {
    var serverUrl = document.location.protocol + "//" + document.location.host + "/" + Xrm.Page.context.getOrgUniqueName();
    var recordUrl = serverUrl + "/main.aspx?etn=new_agreement&pagetype=entityrecord&extraqs=";

    var extRaqs = "";
    var currentSaleName = Xrm.Page.getAttribute("name").getValue();
    var currentsaleId = Xrm.Page.data.entity.getId();

    extRaqs += "&new_sale=" + currentsaleId;
    extRaqs += "&new_salename=" + currentSaleName;
    //extRaqs += "&new_saletype=opportunity";

    if (currentsaleId != null) {
        var contractURL = recordUrl + encodeURIComponent(extRaqs);
        window.open(contractURL, "_blank", "width=900px,height=600px,resizable=1");
    } else {
        alert("Save the current Sale to generate the contract.");
    }
}

function fetchSaleData_onLoad() {
    $(document).ready(function () {
        var currentContractId = Xrm.Page.data.entity.getId();
        if (currentContractId == null) {
            SaleLookup_OnChange();
        }
    });
}

function retrieveRecord(id, odataSetName, successCallback, errorCallback) {
    var context = Xrm.Page.context;
    //var serverUrl = context.getServerUrl();
    var serverUrl = document.location.protocol + "//" + document.location.host + "/" + Xrm.Page.context.getOrgUniqueName();
    var ODATA_ENDPOINT = "/XRMServices/2011/OrganizationData.svc";

    //id is required
    if (!id) {
        alert("record id is required.");
        return;
    }
    //odataSetName is required, i.e. "AccountSet"
    if (!odataSetName) {
        alert("odataSetName is required.");
        return;
    }

    //Asynchronous AJAX function to Retrieve a CRM record using OData
    $.ajax({
        type: "GET",
        contentType: "application/json; charset=utf-8",
        datatype: "json",
        url: serverUrl + ODATA_ENDPOINT + "/" + odataSetName + "(guid'" + id + "')",
        beforeSend: function (XMLHttpRequest) {
            //Specifying this header ensures that the results will be returned as JSON.             
            XMLHttpRequest.setRequestHeader("Accept", "application/json");
        },
        success: function (data, textStatus, XmlHttpRequest) {
            if (successCallback) {
                successCallback(data.d, textStatus, XmlHttpRequest);
            }
        },
        error: function (XmlHttpRequest, textStatus, errorThrown) {
            if (errorCallback)
                errorCallback(XmlHttpRequest, textStatus, errorThrown);
            else
                errorHandler(XmlHttpRequest, textStatus, errorThrown);
        }
    });
}

function errorHandler(xmlHttpRequest, textStatus, errorThrow) {
    alert("Error : " + textStatus + ": " + xmlHttpRequest.statusText);
}

function initializeSalesData() {
    Xrm.Page.getAttribute("new_account").setValue(null);
    Xrm.Page.getAttribute("new_destinationcountry").setValue(null);
    Xrm.Page.getAttribute("new_incoterm").setValue(null);
    Xrm.Page.getAttribute("new_effectivestartdate").setValue(null);
    Xrm.Page.getAttribute("new_shippingtolerance").setValue(null);
    Xrm.Page.getAttribute("new_paymentterm").setValue(null);
    Xrm.Page.ui.controls.get("new_paymentterm").setVisible(false);
    Xrm.Page.getAttribute("new_totalquantity").setValue(null);
    Xrm.Page.getAttribute("new_product").setValue(null);
    Xrm.Page.getAttribute("new_price").setValue(null);
    Xrm.Page.getAttribute("new_sale").setValue(null);
    Xrm.Page.getAttribute("new_name").setValue(null);
    Xrm.Page.getAttribute("new_productfamily").setValue(null);
    Xrm.Page.getAttribute("new_productcategory").setValue(null);
    Xrm.Page.ui.controls.get("new_productcategory").setVisible(false);
    Xrm.Page.getAttribute("new_loadingport").setValue(null);
    Xrm.Page.getAttribute("new_dischargeport").setValue(null);
        
        
}

function initializeContractsData() {
    Xrm.Page.getAttribute("customerid").setValue(null);
    Xrm.Page.getAttribute("new_country").setValue(null);
    Xrm.Page.getAttribute("new_freightterms").setValue(null);
    Xrm.Page.getAttribute("new_startdate").setValue(null);
    Xrm.Page.getAttribute("new_tolerance").setValue(null);
    Xrm.Page.getAttribute("new_paymentterm").setValue(null);
    Xrm.Page.getAttribute("new_quantity").setValue(null);
    Xrm.Page.getAttribute("new_productid").setValue(null);
    Xrm.Page.getAttribute("new_portdestination").setValue(null);
    Xrm.Page.getAttribute("new_portofdischarge").setValue(null);
}