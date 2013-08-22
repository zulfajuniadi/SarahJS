<?php

session_cache_limiter(false);
session_start();

if (!isset($_SESSION['loggedIn'])) {
  $_SESSION['loggedIn'] = false;
}

require_once('vendor/autoload.php');

$config = array();

function setConfig($data) {
    if(is_array($data)) {
        $GLOBALS['config'] = $data;
    }
}

require_once('config.php');

use RedBean_Facade as R;

R::setup('sqlite:../sarah.db');

$app = new \Slim\Slim(array(
    'debug' => true,
    'templates.path' => 'templates',
));


if(!isset($config['email'])) {
    require_once('controllers/config.php');
}

function APIrequest(){
    $app = \Slim\Slim::getInstance();
    $app->view(new \JsonApiView());
    $app->add(new \JsonApiMiddleware());
    $app->response->headers->set('Access-Control-Allow-Origin', 'http://' . $app->request->getHost());
}

$app->get('/logout', function() use ($app){
    session_destroy();
    $app->redirect('/');
});

$app->post('/login', function() use($app, $config){
    $Post = $app->request->post();
    if($config['password'] == md5($Post['password']) && $config['email'] == $Post['email']) {
        $_SESSION['loggedIn'] = true;
    }
    $app->redirect('/');
});

$app->get('/api/sync', 'APIrequest', function() use ($app) {
    $get = $app->request->get();
    $app->render(200,array(
        'msg' => 'welcome to SarahJS Server',
    ));
});

$app->get('/',function() use($app, $config){
    if(!isset($config['email'])) {
        return $app->redirect('/setup');
    } else if($_SESSION['loggedIn'] == true) {
        return $app->render('dashboard.tpl');
    }
    return $app->render("login.tpl");
});

$collections = R::findAll('Collections');

foreach ($collections as $collection) {
    var_dump($app);
}

$app->get('/api','APIrequest',function() use($app){
    $app->render(200,array(
        'msg' => 'welcome to SarahJS Server',
    ));
});

$app->run();