import React from "react";
import { ThemeProvider } from "styled-components";
import { Landing } from "./Landing";
import { NotFound } from "./404";
import { Navbar } from "./Navbar";
import { Profile } from "./Profile";
import { Create } from "./Create";
import { Docs } from "./Docs";
import { Explore } from "./Explore";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";

export const theme = {
	dark: {
		textColor: "#0c0",
		textColorBright: "#0c0"
	}
};

const indentation = [1, 1, 2, 3, 4, 3, 3, 2, 2];
export default () => (
	<Router>
		<ThemeProvider theme={theme.dark}>
			<>
				<Navbar></Navbar>
				<Switch>
					<Route exact path="/" component={Landing}></Route>
					<Route exact path="/docs" component={Docs}></Route>
					<Route exact path="/explore" component={Explore}></Route>
					<Route exact path="/profile" component={Profile}></Route>
					<Route exact path="/new" component={Create}></Route>
					<Route component={NotFound}></Route>
				</Switch>
			</>
		</ThemeProvider>
	</Router>
);
