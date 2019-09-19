import React, { useEffect, useState, useRef } from "react";
import { Link as RouterLink } from "react-router-dom";
import styled from "styled-components";

function generateChar() {
	return String.fromCharCode(33 + Math.floor(Math.random() * (127 - 33)));
}

const linkList = [
	{ name: "cd /root", url: "/" },
	{ name: "man snippit", url: "/docs" },
	{ name: "cd /explore", url: "/explore" },
	{ name: "cd /profile", url: "/profile" },
	{ name: "cd /new", url: "/new" }
];

const Logo = styled.div`
	line-height: 100%;
	display: flex;
	align-items: center;
	:before {
		content: " ";
		display: inline-block;
		width: 2em;
		height: 2em;
		background-color: white;
		margin: 1em;
	}
`;

const Links = styled.div`
	display: flex;
	justify-content: space-around;
	align-items: center;
	a {
		margin: 1em;
		color: #0f0;
	}
`;
const LinkText = styled(RouterLink)`
	text-decoration: none;
	font-size: 1.1em;
`;
const Link = ({ name, url }) => {
	const [currentName, setCurrentName] = useState(name);
	const [matrixing, setMatrixing] = useState(false);

	const stopChanges = () => {
		setMatrixing(false);
	};
	const startChanges = () => {
		setMatrixing(true);
		setCurrentName(
			currentName
				.split("")
				.map(generateChar)
				.join("")
		);
	};

	useEffect(() => {
		console.log(matrixing, currentName !== name, currentName, name);
		if (matrixing && currentName !== name) {
			setTimeout(() => {
				setCurrentName(
					currentName
						.split("")
						.map((v, i) =>
							v === name[i] || Math.random() < 0.1
								? name[i]
								: generateChar()
						)
						.join("")
				);
			}, 50);
		} else {
			setCurrentName(name);
			setMatrixing(false);
		}
	}, [currentName, matrixing]);

	return (
		<LinkText
			to={url}
			onMouseEnter={startChanges}
			onMouseLeave={stopChanges}>
			{currentName}
		</LinkText>
	);
};

const NavbarContainer = styled.div`
	width: 75%;
	margin: auto;
	display: flex;
	height: 4em;
	justify-content: space-between;
	align-items: center;
`;

export const Navbar = () => (
	<NavbarContainer>
		<Logo>Snippit</Logo>

		<Links>
			{linkList.map(p => (
				<Link {...p}></Link>
			))}
		</Links>
	</NavbarContainer>
);
