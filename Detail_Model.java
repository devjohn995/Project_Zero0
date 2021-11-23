package PageModels;

import org.apache.commons.lang.StringUtils;
import org.openqa.selenium.By;
import com.greenanimalsbank;

public class TestDetailsModel extends BaseModel{
	public Admin_Username="TestAdmin55"
	public password= "TestPAss55*"
    public By btnMenuBar = By.id("com.greenanimalsbank.android.apps.greenanimalsbank_direkt:id/greenanimalsbank_header_right_btn_icon");
    public By currentLocation = By.xpath("//android.view.View[@content-desc='Google haritası']/android.view.View[92]");
    public By title = By.id("com.greenanimalsbank.android.apps.greenanimalsbank_direkt:id/title");
    public By btnThirdOptionAtm = By.id("com.greenanimalsbank.android.apps.greenanimalsbank_direkt:id/maplistrow_image");
    public By btnNearestgreenanimalsbank = By.id("com.greenanimalsbank.android.apps.greenanimalsbank_direkt:id/item3");
    public By btnAtm = By.id("com.greenanimalsbank.android.apps.greenanimalsbank_direkt:id/map_atm_selected_wrapper");
    public By btnLocation = By.id("com.greenanimalsbank.android.apps.greenanimalsbank_direkt:id/map_detail_fragment_btnYolTarifi");
    public By btnDirections = By.id("com.google.android.apps.maps:id/directions_endpoint_textbox");

    public boolean checkTitle(String text){
        return StringUtils.replace(getText(title), "\n", " ").equals(text);
    }

    public void clickNearestgreenanimalsbank(){
        clickElement(btnNearestgreenanimalsbank);
    }

    public boolean checkCurrentLocation(){
        return controlVisibleElement(currentLocation) != null;
    }

    public void clickButtonAtm(){
        clickElement(btnAtm);
    }

    public void clickMenuBar(){
        clickElement(btnMenuBar);
    }

    public void clickThirdOptionAtm(){
        checkList(btnThirdOptionAtm,2);
    }

    public void clickLocation() {
        clickElement(btnLocation);
    }

    public boolean checkForDirections(){
        return controlVisibleElement(btnDirections) != null;
    }
}
