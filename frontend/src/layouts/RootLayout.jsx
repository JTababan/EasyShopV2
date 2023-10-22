import { NavLink, Outlet, Link } from "react-router-dom"
import logo from "../logo2.png"
import { useEffect } from "react"
import Footer from "../components/Footer"
import { useUserAuthContext } from "../hooks/useUserAuthContext"

export default function RootLayout() {
    const {user, dispatch} = useUserAuthContext()
    
    function handleLogout(){
        
        localStorage.removeItem('user')

        dispatch({type: 'LOGOUT'})
        
        console.log(user)
    }

    return (
        <>
            <nav className="flex bg-black flex-col ">
            <div className="flex bg-darkgray justify-center h-10 ">
                <nav className="flex  justify-center basis-4/6 item-center">
                    <ul className="flex text-white basis-1/2 h-full items-center  ">
                        <NavLink className="mr-4 Linkhover"  to='/'>Home</NavLink>
                        <NavLink className="mr-4 Linkhover" to='/products'>All Products</NavLink>
                    </ul>
                    <ul>
                    </ul>
                    <ul className="flex text-white basis-1/2 justify-end h-full items-center  ">
                        
                        {user && (
                            <div className="flex">
                                <p className="text-white text-center">{user.email}</p>
                                <button onClick={handleLogout} className="bg-red px-4 py-2 h-10 rounded-sm text-white ">Logout</button>
                            </div>
                        )}
                        {!user && (
                            <div>
                                <NavLink className="mr-4 Linkhover" to='/signup'>Sign up</NavLink>
                                <NavLink className="mr-4 Linkhover" to='/login'>Log in</NavLink>

                            </div>
                        )}
                    </ul>
            
                </nav>
            </div>
            <div className="flex justify-center">
                <div className="flex basis-4/6 justify-center py-4">
                    <div className="basis-2/6 "><img src={logo} alt="logo" className="w-3/4 "></img></div>
                    <div className="flex justify-center basis-4/6">
                        <div className="flex justify-center basis-3/4 items-center ">
                            <form action="/search" method="POST" className="flex w-full h-10 ">
                                <input type="text" className="h-10  basis-5/6 shadow-sm p-2 rounded-tl-3xl rounded-bl-3xl pl-5" placeholder="SEARCH" />
                                <button className="basis-1/6 text-white bg-red rounded-tr-3xl rounded-br-3xl px-5 font-semibold ">SEARCH</button>
                            </form>
                        </div>
                        <div className="flex justify-center items-center basis-1/4  text-white font-semibold  ">
                            <Link to='/cart' className="bg-red px-4 py-2 h-10 rounded-sm">CART</Link>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
        <main>
            <Outlet/>
        </main>
        
        <Footer/>


        </>
    )
}